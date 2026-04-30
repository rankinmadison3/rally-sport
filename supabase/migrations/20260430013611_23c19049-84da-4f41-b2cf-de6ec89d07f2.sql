-- 1. Read state on direct messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- 2. Allow the recipient of a DM to update read_at on their own message
DROP POLICY IF EXISTS "Recipient can mark message read" ON public.chat_messages;
CREATE POLICY "Recipient can mark message read"
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- 3. Last-read tracker for group chat unread counts
CREATE TABLE IF NOT EXISTS public.chat_last_read (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, team_id)
);

ALTER TABLE public.chat_last_read ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own last_read" ON public.chat_last_read;
CREATE POLICY "Users manage their own last_read"
  ON public.chat_last_read
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Realtime
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_last_read REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='chat_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='chat_last_read'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_last_read';
  END IF;
END $$;