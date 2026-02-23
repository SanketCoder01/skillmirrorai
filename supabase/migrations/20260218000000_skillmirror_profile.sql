-- =====================================================
-- SkillMirror Profile Completion & ID Generation
-- =====================================================

-- Add new profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS course TEXT,
ADD COLUMN IF NOT EXISTS prn TEXT,
ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS github TEXT,
ADD COLUMN IF NOT EXISTS skillmirror_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS candidate_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skill_authenticity_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS growth_potential_score INTEGER DEFAULT 0;

-- Create index for skillmirror_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_skillmirror_id ON public.profiles(skillmirror_id);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON public.profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);

-- =====================================================
-- GENERATE UNIQUE SKILLMIRROR ID
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_skillmirror_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    -- Generate SK_ prefix + 6 character alphanumeric
    new_id := 'SK_' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE skillmirror_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    attempts := attempts + 1;
    
    -- Safety limit
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Failed to generate unique SkillMirror ID after 100 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- COMPLETE PROFILE FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.complete_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_university TEXT,
  p_course TEXT,
  p_prn TEXT,
  p_graduation_year INTEGER,
  p_country TEXT,
  p_linkedin TEXT DEFAULT NULL,
  p_github TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_skillmirror_id TEXT;
  v_result JSONB;
BEGIN
  -- Generate unique SkillMirror ID
  v_skillmirror_id := public.generate_skillmirror_id();
  
  -- Update profile
  UPDATE public.profiles
  SET 
    full_name = p_full_name,
    university = p_university,
    course = p_course,
    prn = p_prn,
    graduation_year = p_graduation_year,
    country = p_country,
    linkedin = p_linkedin,
    github = p_github,
    skillmirror_id = v_skillmirror_id,
    profile_completed = true,
    verification_status = 'profile_completed',
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING jsonb_build_object(
    'skillmirror_id', skillmirror_id,
    'full_name', full_name,
    'university', university,
    'course', course,
    'prn', prn,
    'graduation_year', graduation_year,
    'country', country,
    'linkedin', linkedin,
    'github', github,
    'profile_completed', profile_completed,
    'verification_status', verification_status
  ) INTO v_result;
  
  -- Log activity
  INSERT INTO public.user_activity (user_id, activity_type, metadata)
  VALUES (p_user_id, 'profile_completed', jsonb_build_object('skillmirror_id', v_skillmirror_id));
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- SKILL TESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.skill_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending',
  score INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  warnings INTEGER DEFAULT 0,
  tab_switches INTEGER DEFAULT 0,
  camera_warnings INTEGER DEFAULT 0,
  questions JSONB,
  answers JSONB,
  coding_answers JSONB,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tests" ON public.skill_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tests" ON public.skill_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tests" ON public.skill_tests FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_skill_tests_user_id ON public.skill_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_tests_status ON public.skill_tests(status);

-- =====================================================
-- CERTIFICATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skillmirror_id TEXT NOT NULL REFERENCES public.profiles(skillmirror_id),
  verification_score INTEGER NOT NULL,
  test_id UUID REFERENCES public.skill_tests(id),
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  qr_code TEXT,
  pdf_url TEXT,
  certificate_data JSONB
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_skillmirror_id ON public.certificates(skillmirror_id);

-- =====================================================
-- ROADMAPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  current_level TEXT,
  experience_level TEXT DEFAULT 'fresher',
  time_commitment TEXT DEFAULT 'part_time',
  roadmap_data JSONB,
  milestones JSONB,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roadmaps" ON public.roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roadmaps" ON public.roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roadmaps" ON public.roadmaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own roadmaps" ON public.roadmaps FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);

-- =====================================================
-- RESUMES TABLE (for Resume Global Verifier)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  parsed_text TEXT,
  skills_detected JSONB,
  experience JSONB,
  projects JSONB,
  education JSONB,
  certifications JSONB,
  analysis_result JSONB,
  is_verified BOOLEAN DEFAULT false,
  verification_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON public.resumes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

-- =====================================================
-- RECRUITERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recruiters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_website TEXT,
  designation TEXT,
  company_logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own profile" ON public.recruiters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Recruiters can insert own profile" ON public.recruiters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Recruiters can update own profile" ON public.recruiters FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- CANDIDATE VIEWS TABLE (Recruiter Analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.candidate_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skillmirror_id TEXT REFERENCES public.profiles(skillmirror_id),
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contacted BOOLEAN DEFAULT false,
  contact_requested_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.candidate_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own views" ON public.candidate_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.recruiters WHERE user_id = auth.uid() AND id = candidate_views.recruiter_id)
);
CREATE POLICY "Recruiters can insert views" ON public.candidate_views FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.recruiters WHERE user_id = auth.uid() AND id = candidate_views.recruiter_id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_views_recruiter_id ON public.candidate_views(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidate_views_candidate_id ON public.candidate_views(candidate_id);

-- =====================================================
-- STORAGE BUCKET FOR RESUMES
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own resumes" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view own resumes" ON storage.objects FOR SELECT USING (
  bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own resumes" ON storage.objects FOR DELETE USING (
  bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- STORAGE BUCKET FOR CERTIFICATES
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "System can upload certificates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificates');

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_tests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.certificates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmaps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resumes;

-- =====================================================
-- UPDATE TRIGGER FOR ROADMAPS
-- =====================================================
CREATE TRIGGER update_roadmaps_updated_at
  BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
