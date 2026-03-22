-- Add game_result and is_regular_season columns to calendar_events
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS game_result text,
  ADD COLUMN IF NOT EXISTS is_regular_season boolean NOT NULL DEFAULT true;

-- Create recalc trigger function
CREATE OR REPLACE FUNCTION public.recalc_season_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _team_id uuid;
  _wins int;
  _losses int;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _team_id := OLD.team_id;
  ELSE
    _team_id := NEW.team_id;
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN game_result = 'win' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN game_result = 'loss' THEN 1 ELSE 0 END), 0)
  INTO _wins, _losses
  FROM public.calendar_events
  WHERE team_id = _team_id
    AND event_type = 'game'
    AND is_regular_season = true
    AND game_result IS NOT NULL;

  UPDATE public.teams
  SET season_wins = _wins, season_losses = _losses
  WHERE id = _team_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_recalc_season_record ON public.calendar_events;
CREATE TRIGGER trg_recalc_season_record
  AFTER INSERT OR UPDATE OR DELETE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.recalc_season_record();

-- Update calendar_events RLS to allow managers too
DROP POLICY IF EXISTS "Coaches can manage events" ON public.calendar_events;
CREATE POLICY "Coaches and managers can manage events" ON public.calendar_events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'manager'::app_role));