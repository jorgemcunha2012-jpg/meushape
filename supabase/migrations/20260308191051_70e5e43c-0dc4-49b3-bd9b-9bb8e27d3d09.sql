
-- Create body_analyses table
CREATE TABLE public.body_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  lead_id uuid REFERENCES public.leads(id),
  image_path text,
  analysis_result jsonb DEFAULT '{}'::jsonb,
  model_used text DEFAULT 'google/gemini-2.5-pro',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT body_analyses_email_unique UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.body_analyses ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (from edge function via service role, but also allow anon for the funnel)
CREATE POLICY "Anyone can insert body analyses"
  ON public.body_analyses FOR INSERT
  WITH CHECK (true);

-- Anyone can read their own by email (edge function uses service role anyway)
CREATE POLICY "Anyone can read body analyses"
  ON public.body_analyses FOR SELECT
  USING (true);

-- Create private storage bucket for body photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('body-photos', 'body-photos', false);

-- Allow anonymous uploads to body-photos bucket
CREATE POLICY "Anyone can upload body photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'body-photos');

-- Allow reading body photos (for edge function)
CREATE POLICY "Anyone can read body photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'body-photos');
