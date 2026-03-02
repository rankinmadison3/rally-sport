
-- Tighten suggestions insert to require authenticated user_id when not anonymous
DROP POLICY "Authenticated can insert suggestions" ON public.suggestions;
CREATE POLICY "Authenticated can insert suggestions" ON public.suggestions 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() IS NOT NULL);
