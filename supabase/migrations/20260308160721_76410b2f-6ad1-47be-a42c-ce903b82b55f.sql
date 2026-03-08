
-- Profiles table for authenticated users
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  profile_scores JSONB NOT NULL DEFAULT '{}',
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Workout programs (admin-managed weekly plans)
CREATE TABLE public.workout_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL DEFAULT 'beginner',
  days_per_week INTEGER NOT NULL DEFAULT 3,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active programs" ON public.workout_programs FOR SELECT USING (is_active = true);

-- Workouts within a program (e.g., "Treino A - Superior")
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  day_of_week INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read workouts" ON public.workouts FOR SELECT USING (true);

-- Exercises within a workout
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '12',
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  image_url TEXT,
  video_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read exercises" ON public.exercises FOR SELECT USING (true);

-- User workout logs (completed workouts)
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  notes TEXT
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own logs" ON public.workout_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.workout_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Exercise completion within a workout session
CREATE TABLE public.exercise_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  sets_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own exercise logs" ON public.exercise_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.workout_logs wl WHERE wl.id = workout_log_id AND wl.user_id = auth.uid())
);
CREATE POLICY "Users can insert own exercise logs" ON public.exercise_logs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.workout_logs wl WHERE wl.id = workout_log_id AND wl.user_id = auth.uid())
);
CREATE POLICY "Users can update own exercise logs" ON public.exercise_logs FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.workout_logs wl WHERE wl.id = workout_log_id AND wl.user_id = auth.uid())
);

-- Community posts
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read posts" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Community post likes
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own likes" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
