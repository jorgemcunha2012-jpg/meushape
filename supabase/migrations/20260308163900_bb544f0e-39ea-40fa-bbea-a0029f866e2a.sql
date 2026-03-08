
CREATE TABLE public.curated_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercisedb_id text,
  name_pt text NOT NULL,
  name_en text,
  body_part text NOT NULL,
  target text NOT NULL,
  equipment text NOT NULL,
  secondary_muscles text[] DEFAULT '{}',
  difficulty_level integer NOT NULL DEFAULT 1,
  is_female_friendly boolean NOT NULL DEFAULT true,
  focus_category text NOT NULL,
  contraindications text[] DEFAULT '{}',
  location text[] NOT NULL DEFAULT '{gym}',
  priority integer NOT NULL DEFAULT 2,
  default_sets_beginner integer NOT NULL DEFAULT 2,
  default_reps_beginner text NOT NULL DEFAULT '12-15',
  default_rest_beginner integer NOT NULL DEFAULT 60,
  default_sets_intermediate integer NOT NULL DEFAULT 3,
  default_reps_intermediate text NOT NULL DEFAULT '10-12',
  default_rest_intermediate integer NOT NULL DEFAULT 45,
  default_sets_advanced integer NOT NULL DEFAULT 4,
  default_reps_advanced text NOT NULL DEFAULT '8-10',
  default_rest_advanced integer NOT NULL DEFAULT 30,
  simple_instruction_pt text,
  common_mistakes_pt text,
  gif_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.curated_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active curated exercises"
  ON public.curated_exercises FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated can insert curated exercises"
  ON public.curated_exercises FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update curated exercises"
  ON public.curated_exercises FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete curated exercises"
  ON public.curated_exercises FOR DELETE
  TO authenticated
  USING (true);
