-- =====================================================
-- AUTO SCORE CALCULATION FUNCTIONS
-- =====================================================

-- Function to calculate candidate scores
CREATE OR REPLACE FUNCTION public.calculate_candidate_scores(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile RECORD;
  v_candidate_score INTEGER := 0;
  v_risk_score INTEGER := 0;
  v_skill_authenticity_score INTEGER := 0;
  v_growth_potential_score INTEGER := 0;

  v_profile_completeness INTEGER := 0;
  v_verification_status TEXT;
  v_skill_tests_completed INTEGER := 0;
  v_certificates_count INTEGER := 0;
  v_resumes_verified INTEGER := 0;
  v_avg_test_score INTEGER := 0;
  v_has_github BOOLEAN := false;
  v_has_linkedin BOOLEAN := false;
  v_has_projects BOOLEAN := false;
BEGIN
  -- Get profile data
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'candidate_score', 0,
      'risk_score', 0,
      'skill_authenticity_score', 0,
      'growth_potential_score', 0
    );
  END IF;

  -- 1. CANDIDATE SCORE (0-100) - Profile completeness and basic verification
  v_profile_completeness := 0;

  IF v_profile.full_name IS NOT NULL THEN v_profile_completeness := v_profile_completeness + 10; END IF;
  IF v_profile.university IS NOT NULL THEN v_profile_completeness := v_profile_completeness + 15; END IF;
  IF v_profile.course IS NOT NULL THEN v_profile_completeness := v_profile_completeness + 10; END IF;
  IF v_profile.graduation_year IS NOT NULL THEN v_profile_completeness := v_profile_completeness + 10; END IF;
  IF v_profile.country IS NOT NULL THEN v_profile_completeness := v_profile_completeness + 5; END IF;
  IF v_profile.bio IS NOT NULL THEN v_profile_completeness := v_profile_completeness + 10; END IF;
  IF v_profile.linkedin_url IS NOT NULL THEN
    v_profile_completeness := v_profile_completeness + 10;
    v_has_linkedin := true;
  END IF;
  IF v_profile.github IS NOT NULL THEN
    v_profile_completeness := v_profile_completeness + 10;
    v_has_github := true;
  END IF;
  IF v_profile.resume_url IS NOT NULL THEN v_profile_completeness := v_profile_completeness + 10; END IF;
  IF v_profile.profile_completed THEN v_profile_completeness := v_profile_completeness + 10; END IF;

  -- Verification status bonus
  v_verification_status := COALESCE(v_profile.verification_status, 'pending');
  IF v_verification_status = 'verified' THEN
    v_profile_completeness := v_profile_completeness + 10;
  ELSIF v_verification_status = 'profile_completed' THEN
    v_profile_completeness := v_profile_completeness + 5;
  END IF;

  v_candidate_score := LEAST(v_profile_completeness, 100);

  -- 2. RISK SCORE (0-100, higher = lower risk) - Based on verification and consistency
  v_risk_score := 20; -- Base risk score

  -- Completed skill tests reduce risk
  SELECT COUNT(*) INTO v_skill_tests_completed
  FROM public.skill_tests
  WHERE user_id = p_user_id AND status = 'completed';

  IF v_skill_tests_completed > 0 THEN
    v_risk_score := v_risk_score + (v_skill_tests_completed * 15);
  END IF;

  -- Verified certificates reduce risk
  SELECT COUNT(*) INTO v_certificates_count
  FROM public.certificates
  WHERE user_id = p_user_id;

  IF v_certificates_count > 0 THEN
    v_risk_score := v_risk_score + (v_certificates_count * 10);
  END IF;

  -- Verified resumes reduce risk
  SELECT COUNT(*) INTO v_resumes_verified
  FROM public.resumes
  WHERE user_id = p_user_id AND is_verified = true;

  IF v_resumes_verified > 0 THEN
    v_risk_score := v_risk_score + 20;
  END IF;

  -- Social media presence reduces risk
  IF v_has_linkedin THEN v_risk_score := v_risk_score + 10; END IF;
  IF v_has_github THEN v_risk_score := v_risk_score + 15; END IF;

  v_risk_score := LEAST(v_risk_score, 100);

  -- 3. SKILL AUTHENTICITY SCORE (0-100) - Based on verified skills and test performance
  v_skill_authenticity_score := 0;

  -- Average skill test score
  SELECT COALESCE(AVG(score), 0) INTO v_avg_test_score
  FROM public.skill_tests
  WHERE user_id = p_user_id AND status = 'completed';

  IF v_avg_test_score > 0 THEN
    v_skill_authenticity_score := v_skill_authenticity_score + (v_avg_test_score * 0.4);
  END IF;

  -- Certificates add authenticity
  IF v_certificates_count > 0 THEN
    v_skill_authenticity_score := v_skill_authenticity_score + (v_certificates_count * 20);
  END IF;

  -- Verified resumes add authenticity
  IF v_resumes_verified > 0 THEN
    v_skill_authenticity_score := v_skill_authenticity_score + 30;
  END IF;

  -- GitHub presence indicates real coding activity
  IF v_has_github THEN
    v_skill_authenticity_score := v_skill_authenticity_score + 20;
  END IF;

  v_skill_authenticity_score := LEAST(v_skill_authenticity_score, 100);

  -- 4. GROWTH POTENTIAL SCORE (0-100) - Based on education, projects, and activity
  v_growth_potential_score := 0;

  -- Education quality
  IF v_profile.graduation_year IS NOT NULL THEN
    v_growth_potential_score := v_growth_potential_score + 20;
    -- Recent graduates get higher potential
    IF v_profile.graduation_year >= EXTRACT(YEAR FROM CURRENT_DATE) - 2 THEN
      v_growth_potential_score := v_growth_potential_score + 10;
    END IF;
  END IF;

  -- University prestige (simplified check)
  IF v_profile.university IS NOT NULL THEN
    v_growth_potential_score := v_growth_potential_score + 15;
  END IF;

  -- Projects and activity
  SELECT COUNT(*) > 0 INTO v_has_projects
  FROM public.roadmaps
  WHERE user_id = p_user_id;

  IF v_has_projects THEN
    v_growth_potential_score := v_growth_potential_score + 25;
  END IF;

  -- GitHub activity indicates learning and growth
  IF v_has_github THEN
    v_growth_potential_score := v_growth_potential_score + 20;
  END IF;

  -- LinkedIn networking shows professional growth
  IF v_has_linkedin THEN
    v_growth_potential_score := v_growth_potential_score + 10;
  END IF;

  v_growth_potential_score := LEAST(v_growth_potential_score, 100);

  -- Update the profile with new scores
  UPDATE public.profiles
  SET
    candidate_score = v_candidate_score,
    risk_score = v_risk_score,
    skill_authenticity_score = v_skill_authenticity_score,
    growth_potential_score = v_growth_potential_score,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Return the calculated scores
  RETURN jsonb_build_object(
    'candidate_score', v_candidate_score,
    'risk_score', v_risk_score,
    'skill_authenticity_score', v_skill_authenticity_score,
    'growth_potential_score', v_growth_potential_score
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to automatically trigger score updates
CREATE OR REPLACE FUNCTION public.update_profile_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate scores when profile is updated
  PERFORM public.calculate_candidate_scores(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update scores on profile changes
DROP TRIGGER IF EXISTS trigger_update_profile_scores ON public.profiles;
CREATE TRIGGER trigger_update_profile_scores
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_profile_scores();

-- Trigger to update scores when skill tests are completed
CREATE OR REPLACE FUNCTION public.update_scores_on_test_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM public.calculate_candidate_scores(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_scores_on_test_completion ON public.skill_tests;
CREATE TRIGGER trigger_update_scores_on_test_completion
  AFTER UPDATE ON public.skill_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scores_on_test_completion();

-- Trigger to update scores when certificates are issued
CREATE OR REPLACE FUNCTION public.update_scores_on_certificate()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.calculate_candidate_scores(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_scores_on_certificate ON public.certificates;
CREATE TRIGGER trigger_update_scores_on_certificate
  AFTER INSERT ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scores_on_certificate();

-- Trigger to update scores when resumes are verified
CREATE OR REPLACE FUNCTION public.update_scores_on_resume_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_verified = true AND (OLD.is_verified IS NULL OR OLD.is_verified = false) THEN
    PERFORM public.calculate_candidate_scores(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_scores_on_resume_verification ON public.resumes;
CREATE TRIGGER trigger_update_scores_on_resume_verification
  AFTER UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scores_on_resume_verification();
