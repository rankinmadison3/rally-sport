-- Enable realtime for calendar_events so all team members see live updates
ALTER TABLE public.calendar_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;