-- Ensure players cannot assign tasks to other users, and can delete their own self-created tasks.
DROP POLICY IF EXISTS "Players can insert own steps" ON public.action_steps;
CREATE POLICY "Players can insert own steps"
  ON public.action_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND auth.uid() = assigned_by);

CREATE POLICY "Players can delete own self-created steps"
  ON public.action_steps
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND auth.uid() = assigned_by);