import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GROQ_MODEL = "openai/gpt-oss-120b";
const MAX_RESUME_CHARS = 12000;
const MAX_JOB_CHARS = 6000;
const FETCH_TIMEOUT_MS = 60000;

async function callGroqLLM(apiKey: string, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "You are a career analysis AI. Return ONLY valid JSON. No markdown formatting." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 4096,
      top_p: 1,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("rate_limit");
    if (status === 401) throw new Error("invalid_api_key");
    if (status >= 500) throw new Error("server_error");
    throw new Error(`model_error_${status}`);
  }

  const aiData = await response.json();
  let content = aiData.choices?.[0]?.message?.content || "";
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !data?.claims) throw new Error("Unauthorized");
    const userId = data.claims.sub as string;

    const { resumeText, jobDescription, targetRole, location } = await req.json();
    if (!resumeText || typeof resumeText !== "string") {
      return new Response(JSON.stringify({ error: "Resume text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const safeResumeText = resumeText.slice(0, MAX_RESUME_CHARS);
    const safeJobDescription = typeof jobDescription === "string" ? jobDescription.slice(0, MAX_JOB_CHARS) : jobDescription;

    const prompt = `You are an expert career analyst AI for SkillMirror. Analyze the following resume and provide comprehensive career insights.

Resume Text:
${safeResumeText}

${safeJobDescription ? `Job Description:\n${safeJobDescription}` : "No specific job description provided. Do a general career analysis based on the resume."}

${targetRole ? `Target Job Role: ${targetRole}` : ""}
${location ? `Preferred Location: ${location}` : ""}

IMPORTANT INSTRUCTIONS:
1. Analyze the resume based on its content - skills, experience, projects, education
2. If location is India or not specified, show salary in INR (₹) format based on Indian market rates
3. If location is outside India, show salary in USD ($) format
4. Be realistic with salary estimates based on experience level and skills shown in resume
5. Focus on what the resume demonstrates, not what might be missing from a job description

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "profileSummary": "2-3 sentence professional summary based on resume content",
  "coreSkills": ["skill1", "skill2"] - technical skills found in resume,
  "softSkills": ["skill1", "skill2"] - soft skills evident from resume,
  "missingSkills": ["skill1", "skill2"] - skills that would benefit career growth,
  "matchScore": 75 - overall resume strength score (0-100),
  "ATSScore": 70 - ATS compatibility score (0-100),
  "careerLevel": "Junior|Mid|Senior|Lead" - based on experience in resume,
  "suggestedCareerFields": ["field1", "field2"] - based on skills in resume,
  "strengths": ["strength1", "strength2"] - areas where resume shows strength,
  "weaknesses": ["weakness1", "weakness2"] - areas needing improvement,
  "improvementSuggestions": ["suggestion1", "suggestion2"] - actionable improvements,
  "suggestedProjects": [{"title": "Project Name", "description": "Brief description"}] - projects to build missing skills,
  "certifications": ["cert1", "cert2"] - recommended certifications based on career path,
  "marketDemandLevel": "High|Medium|Low" - demand for this profile in Indian market,
  "estimatedSalaryRange": "₹X,00,000 - ₹Y,00,000 per annum" OR "$XX,000 - $YY,000 per annum",
  "salaryInsights": {
    "currency": "INR|USD",
    "minSalary": number - minimum expected salary,
    "maxSalary": number - maximum expected salary,
    "averageSalary": number - average for this profile,
    "experienceMultiplier": number - factor based on experience level,
    "locationFactor": "Metro|Tier-2|Remote" - location impact on salary
  },
  "thirtyDayRoadmap": [{"week": 1, "tasks": ["task1", "task2"]}, {"week": 2, "tasks": ["task1"]}, {"week": 3, "tasks": ["task1"]}, {"week": 4, "tasks": ["task1"]}],
  "resumeRewriteSuggestions": ["suggestion1", "suggestion2"] - specific improvements for resume,
  "jobSearchKeywords": ["keyword1", "keyword2"] - keywords for job search,
  "relatedJobTitles": [{"title": "Job Title", "description": "Brief description", "matchPercentage": number}],
  "keyActions": ["action1", "action2", "action3"] - immediate action items,
  "skillsToFocus": ["skill1", "skill2", "skill3"] - priority skills to develop,
  "bestCareerDirection": "One sentence direction based on resume analysis",
  "riskFactors": ["risk1", "risk2"] - potential career risks,
  "skillCategories": {
    "frontend": number - percentage of frontend skills,
    "backend": number - percentage of backend skills,
    "database": number - percentage of database skills,
    "cloud": number - percentage of cloud/DevOps skills,
    "tools": number - percentage of tools proficiency,
    "softSkills": number - percentage of soft skills
  },
  "skillProficiency": {"skillName": score 0-10} - proficiency score for each skill,
  "experience": {
    "internships": number,
    "freelance": number,
    "fullTime": number,
    "academicProjects": number,
    "totalYears": number
  },
  "careerGrowth": [{"year": "2021", "roles": number, "projects": number}] - year-wise growth,
  "sectionCompleteness": {
    "summary": number 0-100,
    "skills": number 0-100,
    "projects": number 0-100,
    "certifications": number 0-100,
    "achievements": number 0-100
  },
  "technologyUsage": {"technology": count} - frequency of technology mentions,
  "aiInsights": {
    "bestFitRole": "Role title",
    "bestFitScore": number 0-100,
    "skillGaps": ["skill1", "skill2"],
    "strongAreas": ["area1", "area2"]
  },
  "jobMatch": {
    "score": number 0-100,
    "matchedSkills": ["skill1", "skill2"],
    "missingSkills": ["skill1", "skill2"]
  }
}`;

    let content = "";
    try {
      content = await callGroqLLM(GROQ_API_KEY, prompt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg === "rate_limit") {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg === "credits_exhausted") {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg === "AbortError") {
        return new Response(JSON.stringify({ error: "AI request timed out. Please try again." }), {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    let results;
    try {
      results = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI returned invalid JSON");
    }

    const { error: insertError } = await supabase.from("analyses").insert({
      user_id: userId,
      resume_text: resumeText?.substring(0, 5000),
      job_description: jobDescription?.substring(0, 3000),
      target_role: targetRole,
      location: location,
      results_json: results,
      match_score: results.matchScore || 0,
    });

    if (insertError) console.error("Insert error:", insertError);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
