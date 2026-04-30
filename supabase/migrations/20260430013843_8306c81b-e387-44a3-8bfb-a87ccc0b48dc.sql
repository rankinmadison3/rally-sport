-- =========================================================
-- PHASE 1: Schema upgrade for chat_messages
-- =========================================================
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid,
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill nulls then enforce NOT NULL on team_id (every existing row already has one)
UPDATE public.chat_messages SET team_id = team_id WHERE false;
ALTER TABLE public.chat_messages
  ALTER COLUMN team_id SET NOT NULL;

-- updated_at trigger
DROP TRIGGER IF EXISTS chat_messages_set_updated_at ON public.chat_messages;
CREATE TRIGGER chat_messages_set_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_team_created
  ON public.chat_messages (team_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_team_group_created
  ON public.chat_messages (team_id, is_group, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender
  ON public.chat_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient
  ON public.chat_messages (recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_dm_thread
  ON public.chat_messages (team_id, sender_id, recipient_id, created_at);

-- =========================================================
-- PHASE 1 (cont): chat_message_reads
-- =========================================================
CREATE TABLE IF NOT EXISTS public.chat_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_message_reads_message ON public.chat_message_reads (message_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_reads_user ON public.chat_message_reads (user_id);

ALTER TABLE public.chat_message_reads ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- PHASE 2: Helper function — same-team membership check
-- (SECURITY DEFINER to avoid RLS recursion on team_members)
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  ) OR EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = _team_id AND coach_id = _user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO authenticated;

-- =========================================================
-- PHASE 2: RLS rewrite for chat_messages
-- =========================================================
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Recipient can mark message read" ON public.chat_messages;

-- SELECT: group messages visible to team members; DMs visible to sender/recipient on the same team
CREATE POLICY "Read team group + own DMs"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    (is_group = true AND public.is_team_member(auth.uid(), team_id))
    OR
    (is_group = false
      AND (auth.uid() = sender_id OR auth.uid() = recipient_id)
      AND public.is_team_member(auth.uid(), team_id))
  );

-- INSERT: only as self, into a team you belong to, with valid shape
CREATE POLICY "Send messages into own team"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_team_member(auth.uid(), team_id)
    AND (
      (is_group = true AND recipient_id IS NULL)
      OR
      (is_group = false
        AND recipient_id IS NOT NULL
        AND recipient_id <> sender_id
        AND public.is_team_member(recipient_id, team_id))
    )
  );

-- UPDATE: sender can edit/soft-delete own messages; coach/manager can soft-delete in their team
CREATE POLICY "Sender can edit/soft-delete own messages"
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (
    auth.uid() = sender_id
    -- Immutable identity columns enforced via trigger below
  );

CREATE POLICY "Coach/manager can soft-delete team messages"
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    public.is_team_member(auth.uid(), team_id)
    AND (public.has_role(auth.uid(), 'coach'::app_role)
         OR public.has_role(auth.uid(), 'manager'::app_role))
  )
  WITH CHECK (
    public.is_team_member(auth.uid(), team_id)
    AND (public.has_role(auth.uid(), 'coach'::app_role)
         OR public.has_role(auth.uid(), 'manager'::app_role))
  );

-- Trigger to keep identity columns immutable on update
CREATE OR REPLACE FUNCTION public.chat_messages_protect_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.team_id IS DISTINCT FROM OLD.team_id
     OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
     OR NEW.is_group IS DISTINCT FROM OLD.is_group
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify identity columns on chat_messages';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_messages_protect_identity_trg ON public.chat_messages;
CREATE TRIGGER chat_messages_protect_identity_trg
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.chat_messages_protect_identity();

-- =========================================================
-- PHASE 2: RLS for chat_message_reads
-- =========================================================
DROP POLICY IF EXISTS "Users read own receipts" ON public.chat_message_reads;
DROP POLICY IF EXISTS "Users insert own receipts" ON public.chat_message_reads;
DROP POLICY IF EXISTS "Users delete own receipts" ON public.chat_message_reads;

CREATE POLICY "Users read own receipts"
  ON public.chat_message_reads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own receipts"
  ON public.chat_message_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own receipts"
  ON public.chat_message_reads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Realtime
ALTER TABLE public.chat_message_reads REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='chat_message_reads'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reads';
  END IF;
END $$;