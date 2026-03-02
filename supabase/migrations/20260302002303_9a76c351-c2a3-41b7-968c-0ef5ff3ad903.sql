
-- Role enum
CREATE TYPE public.app_role AS ENUM ('coach', 'player');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coach_id UUID NOT NULL,
  season_wins INT NOT NULL DEFAULT 0,
  season_losses INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches can manage teams" ON public.teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coach'));

-- Team members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view team members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches can manage members" ON public.team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coach'));

-- Morale check-ins
CREATE TABLE public.morale_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  mood INT NOT NULL CHECK (mood BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.morale_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can insert own checkins" ON public.morale_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can view checkins" ON public.morale_checkins FOR SELECT TO authenticated USING (true);

-- Suggestions (anonymous)
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can insert suggestions" ON public.suggestions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Coaches can view suggestions" ON public.suggestions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'coach'));

-- Feedback ratings
CREATE TABLE public.feedback_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  rating INT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can insert own ratings" ON public.feedback_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches can view ratings" ON public.feedback_ratings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'coach'));
CREATE POLICY "Players can view own ratings" ON public.feedback_ratings FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Action steps
CREATE TABLE public.action_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Technical',
  done BOOLEAN NOT NULL DEFAULT false,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.action_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view own steps" ON public.action_steps FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Coaches can manage all steps" ON public.action_steps FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coach'));
CREATE POLICY "Players can update own steps" ON public.action_steps FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Calendar events
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'game', 'practice', 'absence'
  label TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view events" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches can manage events" ON public.calendar_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'coach'));

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  is_group BOOLEAN NOT NULL DEFAULT false,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT TO authenticated 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR (is_group = true));
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Feedback form responses
CREATE TABLE public.feedback_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  form_name TEXT NOT NULL DEFAULT 'Post-Game Reflection',
  ratings JSONB NOT NULL DEFAULT '{}',
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback_form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can insert own responses" ON public.feedback_form_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches can view responses" ON public.feedback_form_responses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'coach'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_action_steps_updated_at BEFORE UPDATE ON public.action_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
