-- =====================================================
-- SKILLMIRROR DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. RECRUITER_REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS recruiter_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Index for fast email lookup
CREATE INDEX IF NOT EXISTS idx_recruiter_requests_email ON recruiter_requests(email);
CREATE INDEX IF NOT EXISTS idx_recruiter_requests_status ON recruiter_requests(status);
CREATE INDEX IF NOT EXISTS idx_recruiter_requests_created_at ON recruiter_requests(created_at DESC);

-- =====================================================
-- 2. RECRUITERS TABLE (Approved Recruiters)
-- =====================================================
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  country TEXT,
  company_website TEXT,
  is_verified BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_recruiters_email ON recruiters(email);
CREATE INDEX IF NOT EXISTS idx_recruiters_user_id ON recruiters(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_is_verified ON recruiters(is_verified);

-- =====================================================
-- 3. STUDENTS TABLE (Profiles)
-- =====================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_skillmirror_id ON students(skillmirror_id);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

-- =====================================================
-- 4. PROFILES TABLE (General User Profiles)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  full_name TEXT,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'recruiter', 'admin')),
  skillmirror_id TEXT UNIQUE,
  university TEXT,
  course TEXT,
  country TEXT,
  phone TEXT,
  verification_status TEXT DEFAULT 'pending',
  candidate_score INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  skill_authenticity_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE recruiter_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR RECRUITER_REQUESTS
-- =====================================================

-- Allow anyone to insert (for registration)
CREATE POLICY "Anyone can insert recruiter requests" ON recruiter_requests
  FOR INSERT WITH CHECK (true);

-- Allow admin to select all
CREATE POLICY "Admin can select all recruiter requests" ON recruiter_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR auth.uid() = user_id
  );

-- Allow admin to update (approve/reject)
CREATE POLICY "Admin can update recruiter requests" ON recruiter_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES FOR RECRUITERS
-- =====================================================

-- Allow admin to select all recruiters
CREATE POLICY "Admin can select all recruiters" ON recruiters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR auth.uid() = user_id
  );

-- Allow admin to insert recruiters (after approval)
CREATE POLICY "Admin can insert recruiters" ON recruiters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow admin to update recruiters
CREATE POLICY "Admin can update recruiters" ON recruiters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES FOR STUDENTS
-- =====================================================

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own student profile" ON students
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own student profile" ON students
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow admin to select all students
CREATE POLICY "Admin can select all students" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR auth.uid() = user_id
  );

-- Allow recruiters to select verified students
CREATE POLICY "Recruiters can select verified students" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recruiters 
      WHERE recruiters.user_id = auth.uid() 
      AND recruiters.is_verified = true
    )
    AND verification_status = 'verified'
  );

-- =====================================================
-- RLS POLICIES FOR PROFILES
-- =====================================================

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to select their own profile
CREATE POLICY "Users can select own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow admin to select all profiles
CREATE POLICY "Admin can select all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- =====================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate SkillMirror ID
CREATE OR REPLACE FUNCTION generate_skillmirror_id()
RETURNS TEXT AS $$
DECLARE
  random_num TEXT;
BEGIN
  random_num := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN 'SK_' || random_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate skillmirror_id on student insert
CREATE OR REPLACE FUNCTION set_skillmirror_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.skillmirror_id IS NULL THEN
    NEW.skillmirror_id := generate_skillmirror_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_skillmirror_id ON students;
CREATE TRIGGER trigger_set_skillmirror_id
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION set_skillmirror_id();

-- Trigger for profiles table
DROP TRIGGER IF EXISTS trigger_set_skillmirror_id_profiles ON profiles;
CREATE TRIGGER trigger_set_skillmirror_id_profiles
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_skillmirror_id();

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ENABLE REALTIME
-- =====================================================
-- Run these commands to enable Realtime for the tables
-- You can also do this in Supabase Dashboard: Database → Replication

-- Note: In Supabase Dashboard, go to:
-- Database → Replication → Enable for these tables:
-- - recruiter_requests
-- - recruiters  
-- - students
-- - profiles

-- =====================================================
-- 8. ADMIN USER SETUP
-- =====================================================
-- After creating an admin user in auth.users, run:
-- INSERT INTO profiles (user_id, email, role, full_name)
-- VALUES ('admin-user-uuid', 'admin@email.com', 'admin', 'Admin Name');

-- =====================================================
-- 9. EDGE FUNCTION FOR EMAIL (Reference)
-- =====================================================
-- Create Edge Function 'send-email' in Supabase Dashboard
-- See supabase/functions/send-email/index.ts

COMMIT;
