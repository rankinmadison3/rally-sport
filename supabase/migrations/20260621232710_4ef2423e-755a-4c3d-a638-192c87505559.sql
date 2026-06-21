
-- Status enum + column
DO $$ BEGIN
  CREATE TYPE public.suggestion_status AS ENUM ('new', 'reviewed', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.suggestions
  ADD COLUMN IF NOT EXISTS status public.suggestion_status NOT NULL DEFAULT 'new';

-- Replace the overly-broad coach SELECT policy with team-scoped policies
DROP POLICY IF EXISTS "Coaches can view suggestions" ON public.suggestions;

CREATE POLICY "Staff can view own team suggestions"
  ON public.suggestions FOR SELECT
  USING (
    (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'manager'))
    AND public.is_team_member(auth.uid(), team_id)
  );

CREATE POLICY "Staff can update own team suggestions"
  ON public.suggestions FOR UPDATE
  USING (
    (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'manager'))
    AND public.is_team_member(auth.uid(), team_id)
  )
  WITH CHECK (
    (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'manager'))
    AND public.is_team_member(auth.uid(), team_id)
  );
