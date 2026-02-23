-- =====================================================
-- SKILLMIRROR MIGRATION - Recruiter Flow (Simplified)
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. RECRUITER_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS recruiter_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  country TEXT,
  company_website TEXT,
  status TEXT DEFAULT 'pending',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- 2. ADD COLUMNS TO RECRUITERS TABLE
ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Copy data from old columns if they exist
UPDATE recruiters SET company = company_name WHERE company IS NULL AND company_name IS NOT NULL;
UPDATE recruiters SET position = designation WHERE position IS NULL AND designation IS NOT NULL;

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  full_name TEXT,
  email TEXT UNIQUE,
  university TEXT,
  course TEXT,
  prn TEXT,
  phone TEXT,
  country TEXT,
  skillmirror_id TEXT UNIQUE,
  verification_status TEXT DEFAULT 'pending',
  candidate_score INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  skill_authenticity_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE RLS
ALTER TABLE recruiter_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES (Simple - allow all for now)

-- Recruiter requests
CREATE POLICY "Allow insert recruiter_requests" ON recruiter_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select recruiter_requests" ON recruiter_requests FOR SELECT USING (true);
CREATE POLICY "Allow update recruiter_requests" ON recruiter_requests FOR UPDATE USING (true);

-- Recruiters
CREATE POLICY "Allow select recruiters" ON recruiters FOR SELECT USING (true);
CREATE POLICY "Allow insert recruiters" ON recruiters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update recruiters" ON recruiters FOR UPDATE USING (true);

-- Students
CREATE POLICY "Allow insert students" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select students" ON students FOR SELECT USING (true);
CREATE POLICY "Allow update students" ON students FOR UPDATE USING (true);

-- 6. SKILLMIRROR ID FUNCTION
CREATE OR REPLACE FUNCTION generate_skillmirror_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'SK_' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGER FOR SKILLMIRROR ID
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
  FOR EACH ROW EXECUTE FUNCTION set_skillmirror_id();

-- DONE!
-- Now enable Realtime in Dashboard: Database → Replication → Enable for recruiter_requests, recruiters, students, profiles
