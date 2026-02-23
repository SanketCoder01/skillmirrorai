-- =====================================================
-- SkillMirror AI - Complete Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- ENHANCED PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- ANALYSES TABLE (Resume Analysis History)
-- =====================================================
CREATE TABLE public.analyses (
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

-- Index for faster queries
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);

-- =====================================================
-- REPORTS TABLE
-- =====================================================
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL, -- 'career', 'skills', 'salary', 'roadmap'
  title TEXT,
  content_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.reports FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_analysis_id ON public.reports(analysis_id);

-- =====================================================
-- TASKS TABLE (Career Roadmap Tasks)
-- =====================================================
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  week_number INTEGER NOT NULL, -- 1-4 for 30-day roadmap
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
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

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_analysis_id ON public.tasks(analysis_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- =====================================================
-- USER SESSIONS TABLE (Activity Tracking)
-- =====================================================
CREATE TABLE public.user_sessions (
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

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- =====================================================
-- USER ACTIVITY LOG TABLE
-- =====================================================
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'login', 'logout', 'analysis', 'settings_update', etc.
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Auto-create profile on signup
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
  
  -- Log the signup activity
  INSERT INTO public.user_activity (user_id, activity_type, metadata)
  VALUES (NEW.id, 'signup', jsonb_build_object('email', NEW.email));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Updated_at trigger for tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- AUTO LOGOUT FUNCTION (Check inactive sessions)
-- =====================================================
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

-- =====================================================
-- UPDATE LAST ACTIVITY FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_user_activity(p_user_id UUID, p_session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_sessions
  SET last_activity_at = now()
  WHERE user_id = p_user_id AND session_id = p_session_id AND is_active = true;
  
  -- Also update profile last_seen_at
  UPDATE public.profiles
  SET last_seen_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- EMAIL TEMPLATE CONFIGURATION
-- =====================================================
-- Go to Authentication -> Providers -> Email
-- Enable "Confirm email" 
-- Customize email templates in Authentication -> Email Templates

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS (Enable for analyses, reports, tasks)
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity;

-- =====================================================
-- STORAGE BUCKET FOR AVATARS (Optional)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
