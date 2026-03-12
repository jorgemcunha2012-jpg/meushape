
CREATE TABLE public.exercise_weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_name text NOT NULL,
  weight_kg numeric(6,2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own weight logs"
ON public.exercise_weight_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own weight logs"
ON public.exercise_weight_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_weight_logs_user_exercise ON public.exercise_weight_logs (user_id, exercise_name, created_at);
