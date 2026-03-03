import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GROQ_MODEL = "openai/gpt-oss-120b";

async function callGroqLLM(apiKey: string, prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 4096,
      top_p: 1,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("rate_limit");
    if (response.status === 401) throw new Error("invalid_api_key");
    throw new Error(`model_error_${response.status}`);
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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Unauthorized");

    const { resumeText, targetRole } = await req.json();
    if (!resumeText) throw new Error("Resume text is required");
    if (!targetRole) throw new Error("Target role is required");

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const prompt = `You are an advanced ATS + Resume Intelligence Engine for SkillMirror.

The user has:
1) Uploaded a resume
2) Selected a target job role: "${targetRole}"

Your task:
Analyze the resume strictly based on the selected target role and generate structured output.

--------------------------------------------
STEP 1: ROLE CONTEXT UNDERSTANDING
--------------------------------------------

First:
- Understand what skills, technologies, and experience are typically required for the selected role.
- Identify:
   - Core Technical Skills (high priority)
   - Supporting Skills (medium priority)
   - Optional Skills (low priority)
   - Soft Skills expected
   - Experience level expectation

--------------------------------------------
STEP 2: WEIGHTED ATS SCORING (100%)
--------------------------------------------

Calculate ATS Score using weighted categories:

1. Core Skill Match – 35%
2. Supporting Skill Match – 15%
3. Experience Relevance – 20%
4. Project Impact & Metrics – 15%
5. Tools / DevOps / Testing – 5%
6. Resume Structure & Formatting – 5%
7. Keyword Optimization – 5%

Return:
- Total ATS Score (0–100)
- Breakdown score per category

Use realistic scoring logic.
Do not inflate numbers.

--------------------------------------------
STEP 3: OUTPUT FORMAT FOR DASHBOARD (IMPORTANT)
--------------------------------------------

Return data in two parts:

PART A – Human Readable Explanation (Simple Language)

Explain:
- Why this ATS score was given
- Strong areas
- Weak areas
- Critical missing skills
- Improvement priority list

Use simple professional language.

PART B – Structured JSON for Graphs

Return this exact JSON format:

{
  "atsScore": number,
  "roleFitScore": number,
  "categoryBreakdown": [
    { "name": "Core Skills", "score": number },
    { "name": "Supporting Skills", "score": number },
    { "name": "Experience", "score": number },
    { "name": "Project Impact", "score": number },
    { "name": "Tools & DevOps", "score": number },
    { "name": "Structure", "score": number },
    { "name": "Keywords", "score": number }
  ],
  "skillGapAnalysis": {
    "criticalMissing": [],
    "moderateMissing": [],
    "optionalMissing": []
  },
  "strengthAreas": [],
  "improvementAreas": [],
  "bestFitRoles": [
    { "role": "", "matchPercentage": number }
  ]
}

--------------------------------------------
STEP 4: GRAPH INSTRUCTIONS
--------------------------------------------

Use this logic for dashboard:

1. Circular Graph:
   - Overall ATS Score

2. Bar Chart:
   - Category Breakdown scores

3. Donut Chart:
   - Core vs Supporting vs Missing skill ratio

4. Horizontal Bar:
   - Best Fit Role comparison

--------------------------------------------
STEP 5: ADVANCED ANALYSIS (DIFFERENTIATOR)
--------------------------------------------

Additionally calculate:

- Full Stack Depth Index (if role is full stack)
- Backend Strength Index
- Frontend Strength Index
- Deployment Readiness Score
- Hiring Probability Estimate (%)

Be realistic and data-driven.

--------------------------------------------
STEP 6: BULLET STRENGTH ANALYSIS
--------------------------------------------

Analyze experience bullets:
- Detect vague verbs
- Detect missing metrics
- Score impact strength (0–10)

Suggest 2 improved bullet examples.

--------------------------------------------
STEP 7: LANGUAGE RULES
--------------------------------------------

- Keep explanation simple.
- Avoid generic advice.
- Be specific.
- Prioritize missing high-impact skills.
- Do not repeat resume text.
- Focus on improvement.

Resume Text:
${resumeText}

Return clean structured output in JSON format. Make it professional and recruiter-grade.

Include these additional fields for frontend compatibility:
{
  "ats_score": number - same as atsScore,
  "matching_skills": string[] - skills matched from resume,
  "missing_skills": string[] - critical missing skills,
  "remove_suggestions": string[] - content to remove,
  "improvement_tips": string[] - specific improvement tips,
  "summary_feedback": string - feedback on summary section,
  "weak_sections": string[] - sections needing improvement,
  "keyword_density": {"present": number, "optimal": number, "suggestion": string},
  "formatting_issues": string[] - any formatting problems,
  "section_scores": {"summary": number, "skills": number, "experience": number, "education": number, "overall_format": number},
  "explanation": string - human readable explanation from PART A,
  "bulletAnalysis": {
    "vagueVerbs": string[] - detected vague verbs,
    "missingMetrics": string[] - areas lacking metrics,
    "impactScores": number 0-10,
    "improvedBullets": string[] - 2 improved bullet examples
  },
  "advancedMetrics": {
    "fullStackDepthIndex": number 0-100,
    "backendStrengthIndex": number 0-100,
    "frontendStrengthIndex": number 0-100,
    "deploymentReadinessScore": number 0-100,
    "hiringProbabilityEstimate": number 0-100
  }
}`;

    const systemPrompt = "You are a senior technical recruiter and ATS analysis expert. You give REAL scores, not inflated ones. You think like an actual ATS system. Return ONLY valid JSON. No markdown formatting. Use simple, clear professional language.";
    
    let content;
    try {
      content = await callGroqLLM(GROQ_API_KEY, prompt, systemPrompt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg === "rate_limit") {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
