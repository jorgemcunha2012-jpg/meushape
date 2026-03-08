
-- Track progression cycles per user
CREATE TABLE public.progression_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  current_week integer NOT NULL DEFAULT 1,
  cycle_number integer NOT NULL DEFAULT 1,
  phase text NOT NULL DEFAULT 'adaptation',
  started_at timestamptz NOT NULL DEFAULT now(),
  last_regenerated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

ALTER TABLE public.progression_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cycles" ON public.progression_cycles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles" ON public.progression_cycles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles" ON public.progression_cycles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add feedback column to workout_logs
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS feedback text;
