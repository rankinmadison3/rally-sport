
CREATE TABLE public.action_step_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  notes text,
  category text NOT NULL,
  due_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_step_templates TO authenticated;
GRANT ALL ON public.action_step_templates TO service_role;

ALTER TABLE public.action_step_templates ENABLE ROW LEVEL SECURITY;

-- Coaches (team owner) and managers (team members with manager role) can manage templates
CREATE POLICY "Coaches and managers can view templates"
  ON public.action_step_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.coach_id = auth.uid())
    OR (
      public.has_role(auth.uid(), 'manager')
      AND EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = action_step_templates.team_id AND tm.user_id = auth.uid())
    )
  );

CREATE POLICY "Coaches and managers can insert templates"
  ON public.action_step_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND (
      EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.coach_id = auth.uid())
      OR (
        public.has_role(auth.uid(), 'manager')
        AND EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = action_step_templates.team_id AND tm.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Coaches and managers can update templates"
  ON public.action_step_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.coach_id = auth.uid())
    OR (
      public.has_role(auth.uid(), 'manager')
      AND EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = action_step_templates.team_id AND tm.user_id = auth.uid())
    )
  );

CREATE POLICY "Coaches and managers can delete templates"
  ON public.action_step_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.coach_id = auth.uid())
    OR (
      public.has_role(auth.uid(), 'manager')
      AND EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = action_step_templates.team_id AND tm.user_id = auth.uid())
    )
  );

CREATE TRIGGER update_action_step_templates_updated_at
  BEFORE UPDATE ON public.action_step_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: when a player joins a team, clone all active templates into action_steps
CREATE OR REPLACE FUNCTION public.apply_templates_on_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only apply to players
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'player'
  ) THEN
    INSERT INTO public.action_steps (team_id, user_id, assigned_by, text, notes, category, due_date, done)
    SELECT t.team_id, NEW.user_id, t.created_by, t.text, t.notes, t.category, t.due_date, false
    FROM public.action_step_templates t
    WHERE t.team_id = NEW.team_id AND t.active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_member_added
  AFTER INSERT ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.apply_templates_on_join();
