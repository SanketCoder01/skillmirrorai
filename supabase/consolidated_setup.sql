-- =====================================================
-- SKILLMIRROR AI - CONSOLIDATED DATABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function to check admin role without querying RLS-protected tables (prevents recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(auth.jwt() ->> 'role', '') = 'admin';
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 1. PROFILES TABLE (Base table - created first)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  full_name TEXT,
  university TEXT,
  course TEXT,
  prn TEXT,
  graduation_year INTEGER,
  country TEXT,
  phone TEXT,
  linkedin TEXT,
  github TEXT,
  linkedin_url TEXT,
  research_interest TEXT,
  bio TEXT,
  resume_url TEXT,
  skillmirror_id TEXT UNIQUE,
  profile_completed BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending',
  candidate_score INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  skill_authenticity_score INTEGER DEFAULT 0,
  growth_potential_score INTEGER DEFAULT 0,
  role TEXT DEFAULT 'student',
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_skillmirror_id ON public.profiles(skillmirror_id);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON public.profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);

-- =====================================================
-- 2. RECRUITER_REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recruiter_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  country TEXT,
  company_website TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.recruiter_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_recruiter_requests_email ON public.recruiter_requests(email);
CREATE INDEX IF NOT EXISTS idx_recruiter_requests_status ON public.recruiter_requests(status);
CREATE INDEX IF NOT EXISTS idx_recruiter_requests_created_at ON public.recruiter_requests(created_at DESC);

-- RLS Policies for recruiter_requests
CREATE POLICY "Anyone can insert recruiter requests" ON public.recruiter_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own recruiter request" ON public.recruiter_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for recruiter_requests
CREATE POLICY "Admin can view all recruiter requests" ON public.recruiter_requests
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin can update recruiter requests" ON public.recruiter_requests
  FOR UPDATE USING (public.is_admin());

-- Add position column if migrating from older schema
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruiter_requests' AND column_name = 'position') THEN
    ALTER TABLE public.recruiter_requests ADD COLUMN position TEXT;
  END IF;
END $$;

-- =====================================================
-- 3. RECRUITERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recruiters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_website TEXT,
  designation TEXT,
  company_logo_url TEXT,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  country TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own profile" ON public.recruiters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Recruiters can insert own profile" ON public.recruiters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Recruiters can update own profile" ON public.recruiters FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies for recruiters
CREATE POLICY "Admin can view all recruiters" ON public.recruiters FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin can insert recruiters" ON public.recruiters FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update recruiters" ON public.recruiters FOR UPDATE USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_recruiters_user_id ON public.recruiters(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_email ON public.recruiters(email);
CREATE INDEX IF NOT EXISTS idx_recruiters_is_verified ON public.recruiters(is_verified);

-- =====================================================
-- 4. STUDENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  full_name TEXT,
  email TEXT UNIQUE,
  university TEXT,
  course TEXT,
  prn TEXT,
  phone TEXT,
  country TEXT,
  skillmirror_id TEXT UNIQUE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  candidate_score INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  skill_authenticity_score INTEGER DEFAULT 0,
  linkedin_url TEXT,
  research_interest TEXT,
  bio TEXT,
  resume_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_skillmirror_id ON public.students(skillmirror_id);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at DESC);

-- RLS Policies for students
CREATE POLICY "Users can insert own student profile" ON public.students
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own student profile" ON public.students
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own student profile" ON public.students
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for students
CREATE POLICY "Admin can view all students" ON public.students FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin can update students" ON public.students FOR UPDATE USING (public.is_admin());

-- =====================================================
-- 5. ANALYSES TABLE (Resume Analysis History)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_text TEXT,
  job_description TEXT,
  target_role TEXT,
  location TEXT,
  results_json JSONB,
  match_score INTEGER,
  ats_score INTEGER,
  career_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses" ON public.analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON public.analyses FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);

-- =====================================================
-- 6. REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  title TEXT,
  content_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.reports FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_analysis_id ON public.reports(analysis_id);

-- =====================================================
-- 7. TASKS TABLE (Career Roadmap Tasks)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  week_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_analysis_id ON public.tasks(analysis_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- =====================================================
-- 8. USER SESSIONS TABLE (Activity Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.user_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- =====================================================
-- 9. USER ACTIVITY LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- =====================================================
-- 10. SKILL TESTS TABLE
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
-- 11. CERTIFICATES TABLE
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
-- 12. ROADMAPS TABLE
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
-- 13. RESUMES TABLE
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
-- 14. CANDIDATE VIEWS TABLE (Recruiter Analytics)
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
-- 15. MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);

-- =====================================================
-- 16. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  data JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);

-- =====================================================
-- 17. CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE POLICY "Users can insert own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE INDEX IF NOT EXISTS idx_conversations_participant1_id ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2_id ON public.conversations(participant2_id);

-- =====================================================
-- 18. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate SkillMirror ID
CREATE OR REPLACE FUNCTION public.generate_skillmirror_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    new_id := 'SK_' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE skillmirror_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    attempts := attempts + 1;
    
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Failed to generate unique SkillMirror ID after 100 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, is_active, last_seen_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    true,
    now()
  );
  
  INSERT INTO public.user_activity (user_id, activity_type, metadata)
  VALUES (NEW.id, 'signup', jsonb_build_object('email', NEW.email));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_roadmaps_updated_at ON public.roadmaps;
CREATE TRIGGER update_roadmaps_updated_at
  BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to complete profile
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
  v_skillmirror_id := public.generate_skillmirror_id();
  
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
  
  INSERT INTO public.user_activity (user_id, activity_type, metadata)
  VALUES (p_user_id, 'profile_completed', jsonb_build_object('skillmirror_id', v_skillmirror_id));
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check user inactivity
CREATE OR REPLACE FUNCTION public.check_user_inactivity(p_user_id UUID, p_minutes INTEGER DEFAULT 5)
RETURNS BOOLEAN AS $$
DECLARE
  last_activity TIMESTAMP WITH TIME ZONE;
  inactive_interval INTERVAL;
BEGIN
  inactive_interval := p_minutes * INTERVAL '1 minute';
  
  SELECT MAX(last_activity_at) INTO last_activity
  FROM public.user_sessions
  WHERE user_id = p_user_id AND is_active = true;
  
  IF last_activity IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN (now() - last_activity) > inactive_interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update user activity
CREATE OR REPLACE FUNCTION public.update_user_activity(p_user_id UUID, p_session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_sessions
  SET last_activity_at = now()
  WHERE user_id = p_user_id AND session_id = p_session_id AND is_active = true;
  
  UPDATE public.profiles
  SET last_seen_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 16. STORAGE BUCKETS
-- =====================================================

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Resumes bucket
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

-- Certificates bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "System can upload certificates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificates');

-- =====================================================
-- 19. ENABLE REAL-TIME SUBSCRIPTIONS
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_tests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.certificates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmaps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resumes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidate_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- After running this file:
-- 1. Go to Authentication > Providers and enable Email provider
-- 2. IMPORTANT: Enable "Confirm email" in Authentication > Providers > Email
--    This requires users to verify email before they can sign in
-- 3. Configure email templates in Authentication > Email Templates:
--    - Confirm signup: Email sent when user registers
--    - Magic Link: Email for passwordless login (optional)
--    - Change Email: Email when user changes email (optional)
--    - Reset Password: Email for password reset
-- 4. Set up any additional OAuth providers if needed (Google, GitHub, etc.)
-- 5. Create an admin user manually:
--    a. Sign up normally through the app
--    b. In SQL Editor, run: UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
-- =====================================================
