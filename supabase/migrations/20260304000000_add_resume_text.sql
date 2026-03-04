-- Add resume_text column to profiles table for fast analysis
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_text TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_resume_text ON public.profiles(resume_text) WHERE resume_text IS NOT NULL;

-- Add analysis_status to analyses table for tracking
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'processing';
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Update existing analyses to 'done' status
UPDATE public.analyses SET analysis_status = 'done' WHERE results_json IS NOT NULL AND analysis_status IS NULL;
