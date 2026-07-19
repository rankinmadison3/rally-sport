DO $$
DECLARE
  v_user_id uuid := '8eb4932d-0abc-48c0-a8e0-33e961b5de9f';
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE coach_id = v_user_id) THEN
    INSERT INTO public.teams (name, code, coach_id, season_wins, season_losses)
    VALUES ('Test Team', 'C26DED', v_user_id, 0, 0)
    RETURNING id INTO v_team_id;

    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (v_team_id, v_user_id, 'coach');
  END IF;
END $$;