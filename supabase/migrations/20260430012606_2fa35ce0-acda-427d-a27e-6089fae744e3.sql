-- Add per-player columns
ALTER TABLE public.feedback_form_assignments
  ADD COLUMN IF NOT EXISTS player_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ffa_player_team_active
  ON public.feedback_form_assignments (player_id, team_id, is_active);

CREATE INDEX IF NOT EXISTS idx_ffa_form_team
  ON public.feedback_form_assignments (form_id, team_id);

-- Prevent duplicate active assignments (same form, player, team)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ffa_active_per_player
  ON public.feedback_form_assignments (form_id, team_id, player_id)
  WHERE is_active = true AND player_id IS NOT NULL;

-- Replace the broad SELECT policy with one that scopes to the player or coach/manager
DROP POLICY IF EXISTS "Authenticated can view assignments" ON public.feedback_form_assignments;

CREATE POLICY "Players see own, coaches/managers see all"
  ON public.feedback_form_assignments FOR SELECT TO authenticated
  USING (
    player_id = auth.uid()
    OR has_role(auth.uid(), 'coach'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
  );

-- Allow players to update only their own assignment (mark submitted)
CREATE POLICY "Players can update own assignment"
  ON public.feedback_form_assignments FOR UPDATE TO authenticated
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());