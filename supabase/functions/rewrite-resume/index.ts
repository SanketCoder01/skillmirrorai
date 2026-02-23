import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Unauthorized");

    const { resumeText, jobDescription } = await req.json();
    if (!resumeText) throw new Error("Resume text is required");
    if (!jobDescription) throw new Error("Job description is required");

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const prompt = `You are an expert ATS system, senior technical recruiter, and resume optimization specialist.

You will receive:
1) A job description
2) A candidate resume

Your job is to deeply analyze BOTH, do a realistic skill-gap analysis, and rewrite the resume to maximize shortlisting probability.

NON-NEGOTIABLE RULES:
1. Do NOT add fake experience, fake companies, fake dates, fake degrees, or fake achievements.
2. Do NOT add skills that are not reasonably supported by the resume text.
3. You MAY rephrase, reorder, and strengthen existing content.
4. Keep the output ATS-friendly: clean sections, simple formatting, no tables, no icons, no markdown.
5. Be analytical and structured. Avoid fluff.

TASK 1: Analyze the Job Description deeply
- Extract required technical skills
- Extract preferred skills
- Identify repeated keywords (top 10)
- Identify role seniority
- Identify industry domain
- Identify soft skills expectations

TASK 2: Analyze the Candidate Resume
- Extract technical skills
- Extract projects and achievements
- Identify measurable impact (existing numbers)
- Identify weak bullet points
- Identify missing quantification
- Identify irrelevant information

TASK 3: Skill Gap Analysis
- Matched skills
- Partially matched skills (and what is missing)
- Missing skills
- Suggested additions (ONLY realistic additions that could be inferred or are small, truthful improvements like adding a missing keyword already implied)

TASK 4: Rewrite the Resume
- Optimize summary for the specific role
- Improve bullet points using strong action verbs
- Add quantifiable impact ONLY where reasonable (do not invent numbers; you may suggest "Add metric: <what to measure>" if unknown)
- Naturally integrate important keywords from the JD
- Keep resume believable and professional

TASK 5: Provide scoring + reports
- ATS Match Score (percentage)
- Keyword Match Percentage
- Section-wise improvement report
- Risk factors (if any)
- Final optimized resume output

Resume Text:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON (no markdown, no code fences). CRITICAL: Keep these existing keys for frontend compatibility:
- optimized_summary (string)
- optimized_skills (string[])
- optimized_experience ({original:string, optimized:string}[])
- added_keywords (string[])
- removed_content (string[])
- missing_from_resume (string[])
- optimization_score ({before:number, after:number})
- tone_feedback (string)
- additional_tips (string[])
- full_optimized_resume (string)

In addition, include these NEW keys:
{
  "job_analysis": {
    "required_technical_skills": [""],
    "preferred_skills": [""],
    "repeated_keywords": [{"keyword":"", "count": 0}],
    "role_seniority": "",
    "industry_domain": "",
    "soft_skills": [""]
  },
  "resume_analysis": {
    "extracted_technical_skills": [""],
    "projects_and_achievements": [""],
    "measurable_impact_found": [""],
    "weak_bullets": [""],
    "missing_quantification": [""],
    "irrelevant_information": [""]
  },
  "skill_gap_analysis": {
    "matched_skills": [""],
    "partially_matched_skills": [{"skill":"", "missing": ""}],
    "missing_skills": [""],
    "suggested_additions": [""]
  },
  "ats_match_score": 0,
  "keyword_match_percentage": 0,
  "section_improvement_report": [{"section":"Summary", "issues":[""], "fixes":[""]}],
  "risk_factors": [""]
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: [
          { role: "system", content: "You are an expert ATS engine + senior technical recruiter + resume optimization specialist. You are strict, analytical, and structured. You do not hallucinate. Return ONLY valid JSON with all requested keys. No markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let results;
    try {
      results = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI returned invalid JSON");
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rewrite-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
