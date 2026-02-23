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

    const { resumeText, targetRole } = await req.json();
    if (!resumeText) throw new Error("Resume text is required");
    if (!targetRole) throw new Error("Target role is required");

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const prompt = `You are an advanced ATS engine and senior technical recruiter.

The user has provided:
1. Resume
2. Target Job Role Name only (no job description)

Your task:

STEP 1: Build Role Intelligence
- Based on the job role name "${targetRole}", generate industry-standard:
  - Core technical skills
  - Preferred skills
  - Tools commonly required
  - Soft skills expected
  - Experience expectations (Fresher/Mid/Senior)
  - Common responsibilities

STEP 2: Parse Resume
- Extract skills
- Extract projects
- Extract experience
- Extract measurable achievements
- Identify weak bullet points
- Identify missing metrics

STEP 3: Skill Gap Analysis
- Matched core skills
- Missing core skills
- Matched preferred skills
- Missing preferred skills
- Overqualified areas (if any)

STEP 4: ATS Score Calculation
Use weighted logic:
- Core Skill Match (40%)
- Preferred Skill Match (15%)
- Experience Relevance (15%)
- Project Strength (10%)
- Quantified Impact (10%)
- ATS Formatting (10%)

IMPORTANT:
- Do not hallucinate fake experience.
- Do not add unrealistic skills.
- Keep resume believable.
- Think like a recruiter selecting top 10% candidates.

Resume Text:
${resumeText}

Return ONLY valid JSON (no markdown, no code fences).

CRITICAL: keep these existing keys (frontend compatibility):
- ats_score (number)
- matching_skills (string[])
- missing_skills (string[])
- remove_suggestions (string[])
- improvement_tips (string[])
- summary_feedback (string)
- weak_sections (string[])
- keyword_density ({present:number, optimal:number, suggestion:string})
- formatting_issues (string[])
- section_scores ({summary:number, skills:number, experience:number, education:number, overall_format:number})

In addition, include these NEW keys:
{
  "role_intelligence": {
    "core_technical_skills": [""],
    "preferred_skills": [""],
    "tools": [""],
    "soft_skills": [""],
    "experience_expectation": "",
    "common_responsibilities": [""]
  },
  "resume_parsing": {
    "extracted_skills": [""],
    "projects": [""],
    "experience_summary": [""],
    "measurable_achievements": [""],
    "weak_bullets": [""],
    "missing_metrics": [""]
  },
  "skill_gap": {
    "matched_core_skills": [""],
    "missing_core_skills": [""],
    "matched_preferred_skills": [""],
    "missing_preferred_skills": [""],
    "overqualified_areas": [""]
  },
  "ats_breakdown": {
    "core_skill_match": 0,
    "preferred_skill_match": 0,
    "experience_relevance": 0,
    "project_strength": 0,
    "quantified_impact": 0,
    "ats_formatting": 0
  },
  "risk_factors": [""],
  "optimized_resume_for_role": ""
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
          { role: "system", content: "You are a senior technical recruiter and ATS analysis expert. You give REAL scores, not inflated ones. You think like an actual ATS system. Return ONLY valid JSON. No markdown formatting. Use simple, clear professional language." },
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
    console.error("ats-analyzer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
