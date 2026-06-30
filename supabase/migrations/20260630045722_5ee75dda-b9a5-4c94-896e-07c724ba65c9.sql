
-- =============================================
-- Helper: are users on the same team?
-- =============================================
CREATE OR REPLACE FUNCTION public.are_team_mates(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm_a
    JOIN public.team_members tm_b ON tm_a.team_id = tm_b.team_id
    WHERE tm_a.user_id = _a AND tm_b.user_id = _b
  ) OR EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE (t.coach_id = _a AND public.is_team_member(_b, t.id))
       OR (t.coach_id = _b AND public.is_team_member(_a, t.id))
       OR (t.coach_id = _a AND t.coach_id = _b)
  );
$$;

REVOKE ALL ON FUNCTION public.are_team_mates(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_team_mates(uuid, uuid) TO authenticated, service_role;

-- =============================================
-- profiles: restrict SELECT to self or same team
-- =============================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view profiles of self or teammates"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.are_team_mates(auth.uid(), user_id)
);

-- =============================================
-- user_roles: prevent privilege escalation
-- Only allow self-insert of 'player'; staff roles via RPC
-- =============================================
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can self-assign player role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'player'::app_role);

-- Centralized signup RPC that handles role assignment + team setup atomically.
-- Coach: creates own team. Manager: requires valid join code. Player: requires valid join code.
CREATE OR REPLACE FUNCTION public.signup_with_role(
  p_role app_role,
  p_display_name text,
  p_team_code text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_team_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'Role already assigned';
  END IF;

  IF p_role = 'coach'::app_role THEN
    INSERT INTO public.teams (name, coach_id)
    VALUES (COALESCE(NULLIF(p_display_name,'') || '''s Team', 'My Team'), v_uid)
    RETURNING id INTO v_team_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'coach'::app_role);
    RETURN v_team_id;
  ELSIF p_role IN ('manager'::app_role, 'player'::app_role) THEN
    IF p_team_code IS NULL OR length(p_team_code) = 0 THEN
      RAISE EXCEPTION 'Team code required';
    END IF;
    SELECT id INTO v_team_id FROM public.teams WHERE code = upper(p_team_code);
    IF v_team_id IS NULL THEN
      RAISE EXCEPTION 'Invalid team code';
    END IF;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, p_role);
    INSERT INTO public.team_members (team_id, user_id) VALUES (v_team_id, v_uid)
      ON CONFLICT DO NOTHING;
    RETURN v_team_id;
  ELSE
    RAISE EXCEPTION 'Invalid role';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.signup_with_role(app_role, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.signup_with_role(app_role, text, text) TO authenticated;

-- =============================================
-- teams: hide join code; only members + coach can see their teams
-- Add SECURITY DEFINER helper for code lookup by current user (already in RPC)
-- =============================================
DROP POLICY IF EXISTS "Authenticated can view teams" ON public.teams;
CREATE POLICY "Members and coaches can view their teams"
ON public.teams FOR SELECT
TO authenticated
USING (
  coach_id = auth.uid()
  OR public.is_team_member(auth.uid(), id)
);

-- =============================================
-- morale_checkins: self + same-team staff
-- =============================================
DROP POLICY IF EXISTS "Authenticated can view checkins" ON public.morale_checkins;
CREATE POLICY "Self or same-team staff can view checkins"
ON public.morale_checkins FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (
    (public.has_role(auth.uid(), 'coach'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
    AND public.are_team_mates(auth.uid(), user_id)
  )
);

-- =============================================
-- feedback_form_responses: scope coach by team, add player self-read
-- =============================================
DROP POLICY IF EXISTS "Coaches can view responses" ON public.feedback_form_responses;
CREATE POLICY "Same-team coaches can view responses"
ON public.feedback_form_responses FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coach'::app_role)
  AND public.is_team_member(auth.uid(), team_id)
);

CREATE POLICY "Same-team managers can view responses"
ON public.feedback_form_responses FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager'::app_role)
  AND public.is_team_member(auth.uid(), team_id)
);

CREATE POLICY "Players can view their own responses"
ON public.feedback_form_responses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- feedback_ratings: scope coach/manager by team
-- =============================================
DROP POLICY IF EXISTS "Coaches can view ratings" ON public.feedback_ratings;
DROP POLICY IF EXISTS "Managers can view ratings" ON public.feedback_ratings;

CREATE POLICY "Same-team coaches can view ratings"
ON public.feedback_ratings FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coach'::app_role)
  AND public.is_team_member(auth.uid(), team_id)
);

CREATE POLICY "Same-team managers can view ratings"
ON public.feedback_ratings FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager'::app_role)
  AND public.is_team_member(auth.uid(), team_id)
);

-- =============================================
-- Lock down SECURITY DEFINER functions
-- =============================================
-- Trigger-only functions: revoke from anon + authenticated (only postgres/service_role need EXECUTE)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_templates_on_join() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_season_record() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.chat_messages_protect_identity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Authenticated helpers: revoke from anon, keep authenticated
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO authenticated, service_role;

-- =============================================
-- storage.objects: stop avatar listing
-- Public bucket still serves files via public URL even without RLS SELECT (bucket public flag).
-- Restrict SELECT policy to a user's own folder so listing other users is impossible.
-- =============================================
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Users can view files in their own avatar folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
