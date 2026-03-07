
-- Leads table (public - no auth required for quiz submissions)
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_scores JSONB NOT NULL DEFAULT '{}',
  quiz_answers JSONB NOT NULL DEFAULT '{}',
  opted_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Funnel visits tracking
CREATE TABLE public.funnel_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Checkout events
CREATE TABLE public.checkout_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated',
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_events ENABLE ROW LEVEL SECURITY;

-- Public insert policies (quiz is public, no auth required)
CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert visits" ON public.funnel_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert checkout events" ON public.checkout_events FOR INSERT WITH CHECK (true);

-- Admin read policies will be added after admin auth is set up
-- For now, allow authenticated users to read (admin will be authenticated)
CREATE POLICY "Authenticated users can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read visits" ON public.funnel_visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read checkout events" ON public.checkout_events FOR SELECT TO authenticated USING (true);
