
CREATE TABLE public.exercise_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  musclewiki_id integer NOT NULL,
  exercise_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, musclewiki_id)
);

ALTER TABLE public.exercise_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites" ON public.exercise_favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.exercise_favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.exercise_favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
