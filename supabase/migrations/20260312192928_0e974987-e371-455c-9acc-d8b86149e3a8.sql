
-- Add type column to workout_programs to distinguish plan/challenge/project
ALTER TABLE public.workout_programs 
ADD COLUMN IF NOT EXISTS program_type text NOT NULL DEFAULT 'plan';

-- Table to track user generation limits
CREATE TABLE public.user_generation_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  generation_type text NOT NULL, -- 'plan', 'challenge', 'project'
  last_generated_at timestamp with time zone NOT NULL DEFAULT now(),
  active_program_id uuid REFERENCES public.workout_programs(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, generation_type)
);

ALTER TABLE public.user_generation_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own limits" ON public.user_generation_limits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own limits" ON public.user_generation_limits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own limits" ON public.user_generation_limits
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Table to track extra purchases
CREATE TABLE public.user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  purchase_type text NOT NULL, -- 'challenge', 'project'
  stripe_session_id text,
  program_id uuid REFERENCES public.workout_programs(id) ON DELETE SET NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases" ON public.user_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.user_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
