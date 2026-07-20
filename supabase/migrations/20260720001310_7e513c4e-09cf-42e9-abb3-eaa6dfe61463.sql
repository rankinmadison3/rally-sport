
INSERT INTO public.team_members (team_id, user_id)
SELECT t.id, t.coach_id
FROM public.teams t
LEFT JOIN public.team_members tm ON tm.team_id = t.id AND tm.user_id = t.coach_id
WHERE tm.id IS NULL AND t.coach_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.add_coach_as_team_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.coach_id IS NOT NULL THEN
    INSERT INTO public.team_members (team_id, user_id)
    VALUES (NEW.id, NEW.coach_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS teams_add_coach_member ON public.teams;
CREATE TRIGGER teams_add_coach_member
AFTER INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.add_coach_as_team_member();

DROP FUNCTION IF EXISTS public.signup_with_role(app_role, text, text);

CREATE OR REPLACE FUNCTION public.signup_with_role(
  p_role app_role,
  p_display_name text,
  p_team_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_team_id uuid;
  v_existing_role app_role;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_existing_role FROM public.user_roles WHERE user_id = v_uid LIMIT 1;

  IF p_role = 'coach'::app_role THEN
    IF v_existing_role IS NOT NULL THEN
      RAISE EXCEPTION 'Role already assigned';
    END IF;
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
    IF v_existing_role IS NULL THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, p_role);
    ELSIF v_existing_role <> p_role THEN
      RAISE EXCEPTION 'Role already assigned';
    END IF;
    INSERT INTO public.team_members (team_id, user_id) VALUES (v_team_id, v_uid)
      ON CONFLICT DO NOTHING;
    RETURN v_team_id;
  ELSE
    RAISE EXCEPTION 'Invalid role';
  END IF;
END;
$$;
