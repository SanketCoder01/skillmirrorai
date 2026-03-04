import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GROQ_MODEL = "llama-3.3-70b-versatile"; // Fast model
const MAX_RESUME_CHARS = 8000;
const MAX_JOB_CHARS = 4000;
const FETCH_TIMEOUT_MS = 30000;

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
      max_completion_tokens: 2048,
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

    const prompt = `Analyze this resume and return ONLY JSON (no markdown):

Resume:
${safeResumeText}

${safeJobDescription ? `Job Description:\n${safeJobDescription}` : ""}

Return this JSON structure:
{
  "profileSummary": "2-3 sentence summary",
  "coreSkills": ["skill1", "skill2"],
  "softSkills": ["skill1"],
  "missingSkills": ["skill1"],
  "matchScore": 75,
  "ATSScore": 70,
  "careerLevel": "Junior|Mid|Senior",
  "strengths": ["strength1"],
  "weaknesses": ["weakness1"],
  "improvementSuggestions": ["suggestion1"],
  "estimatedSalaryRange": "₹3,00,000 - ₹6,00,000",
  "skillCategories": {"frontend": 30, "backend": 25, "database": 15, "cloud": 10, "tools": 10, "softSkills": 10},
  "skillProficiency": {"skill": 8},
  "experience": {"internships": 0, "freelance": 0, "fullTime": 0, "academicProjects": 2, "totalYears": 0},
  "aiInsights": {"bestFitRole": "Role", "bestFitScore": 80, "skillGaps": ["skill"], "strongAreas": ["area"]},
  "jobMatch": {"score": 75, "matchedSkills": ["skill"], "missingSkills": ["skill"]}
}

Be concise. Estimate scores 0-100.`;

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
