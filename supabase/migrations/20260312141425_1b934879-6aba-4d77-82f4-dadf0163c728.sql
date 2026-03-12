
-- 1. Add onboarding_answers column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_answers jsonb DEFAULT '{}'::jsonb;

-- 2. Replace handle_new_user to link lead by email + copy quiz_answers to onboarding_answers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _lead_id uuid;
  _lead_scores jsonb;
  _lead_quiz jsonb;
BEGIN
  -- Try to find a matching lead by email
  SELECT id, profile_scores, quiz_answers INTO _lead_id, _lead_scores, _lead_quiz
  FROM public.leads
  WHERE email = COALESCE(NEW.email, '')
  ORDER BY created_at DESC
  LIMIT 1;

  INSERT INTO public.profiles (id, email, name, lead_id, profile_scores, onboarding_answers)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    _lead_id,
    COALESCE(_lead_scores, '{}'::jsonb),
    COALESCE(_lead_quiz, '{}'::jsonb)
  );
  RETURN NEW;
END;
$$;

-- 3. Recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
