
-- Create user_programs table to link users to programs
CREATE TABLE public.user_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  is_favorite boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, program_id)
);

-- Enable RLS
ALTER TABLE public.user_programs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own programs
CREATE POLICY "Users can read own user_programs"
  ON public.user_programs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add programs to their list
CREATE POLICY "Users can insert own user_programs"
  ON public.user_programs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own (e.g. toggle favorite)
CREATE POLICY "Users can update own user_programs"
  ON public.user_programs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can remove programs from their list
CREATE POLICY "Users can delete own user_programs"
  ON public.user_programs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
