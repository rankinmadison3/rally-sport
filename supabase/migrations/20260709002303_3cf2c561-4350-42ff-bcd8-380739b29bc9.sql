
-- 1. Team members: only members/coach of that team can see the member list
DROP POLICY IF EXISTS "Authenticated can view team members" ON public.team_members;
CREATE POLICY "Members can view their team's members"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

-- 2. Calendar events: only visible to team members/coach
DROP POLICY IF EXISTS "Authenticated can view events" ON public.calendar_events;
CREATE POLICY "Team members can view their events"
  ON public.calendar_events
  FOR SELECT
  TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

-- 3. Feedback forms: system/global templates OR forms for teams the user belongs to
DROP POLICY IF EXISTS "Anyone authenticated can view system templates" ON public.feedback_forms;
CREATE POLICY "System templates and own-team forms are visible"
  ON public.feedback_forms
  FOR SELECT
  TO authenticated
  USING (
    is_system = true
    OR is_template = true
    OR (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
  );

-- 4. Lock down SECURITY DEFINER functions
-- Trigger-only: no direct execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_templates_on_join() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_season_record() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.chat_messages_protect_identity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- RLS helpers: only authenticated needs execute (policies evaluate as caller)
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.are_team_mates(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_team_mates(uuid, uuid) TO authenticated, service_role;

-- Signup RPC: authenticated only (called immediately after auth.signUp establishes session)
REVOKE ALL ON FUNCTION public.signup_with_role(app_role, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.signup_with_role(app_role, text, text) TO authenticated, service_role;
