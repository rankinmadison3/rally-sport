-- 1. feedback_forms: form definitions (templates + custom forms)
CREATE TABLE public.feedback_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_template boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT false,
  team_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view system templates"
  ON public.feedback_forms FOR SELECT TO authenticated
  USING (is_system = true OR is_template = true OR team_id IS NOT NULL);

CREATE POLICY "Coaches and managers can manage forms"
  ON public.feedback_forms FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER update_feedback_forms_updated_at
  BEFORE UPDATE ON public.feedback_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. feedback_form_assignments: broadcast a form to a team
CREATE TABLE public.feedback_form_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.feedback_forms(id) ON DELETE CASCADE,
  team_id uuid NOT NULL,
  due_date date,
  recurrence text NOT NULL DEFAULT 'none', -- none | weekly | monthly
  broadcast_at timestamptz NOT NULL DEFAULT now(),
  broadcast_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_form_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view assignments"
  ON public.feedback_form_assignments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Coaches and managers can manage assignments"
  ON public.feedback_form_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- 3. Extend feedback_form_responses to link to form + assignment
ALTER TABLE public.feedback_form_responses
  ADD COLUMN form_id uuid REFERENCES public.feedback_forms(id) ON DELETE SET NULL,
  ADD COLUMN assignment_id uuid REFERENCES public.feedback_form_assignments(id) ON DELETE SET NULL,
  ADD COLUMN text_answers jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 4. Seed system templates
INSERT INTO public.feedback_forms (name, description, questions, is_template, is_system) VALUES
('Post-Game Reflection', 'Quick reflection after a game',
 '[
   {"id":"coaching","type":"rating","label":"Coaching Effectiveness","scale":5},
   {"id":"communication","type":"rating","label":"Team Communication","scale":5},
   {"id":"training","type":"scale","label":"Training Quality","scale":10},
   {"id":"environment","type":"scale","label":"Team Environment","scale":10},
   {"id":"notes","type":"text","label":"Anything else to share?"}
 ]'::jsonb, true, true),
('Weekly Check-in', 'How is the week going?',
 '[
   {"id":"workload","type":"scale","label":"Workload manageability","scale":10},
   {"id":"energy","type":"rating","label":"Energy level","scale":5},
   {"id":"focus","type":"rating","label":"Focus level","scale":5},
   {"id":"comments","type":"text","label":"Comments"}
 ]'::jsonb, true, true),
('Training Quality', 'Rate the most recent training session',
 '[
   {"id":"intensity","type":"scale","label":"Training intensity","scale":10},
   {"id":"clarity","type":"rating","label":"Drill clarity","scale":5},
   {"id":"enjoyment","type":"rating","label":"Enjoyment","scale":5},
   {"id":"suggestions","type":"text","label":"Suggestions for next session"}
 ]'::jsonb, true, true);