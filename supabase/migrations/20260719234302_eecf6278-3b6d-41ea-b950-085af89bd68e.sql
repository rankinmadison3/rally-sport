CREATE UNIQUE INDEX IF NOT EXISTS morale_checkins_one_per_user_per_day
ON public.morale_checkins (user_id, ((created_at AT TIME ZONE 'UTC')::date));