import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

<<<<<<< C:/Users/SANKET/skillmirrorai/supabase/functions/analyze-resume/index.ts
const DEFAULT_MODEL = "google/gemini-pro-1.5-flash";

const MAX_RESUME_CHARS = 12000;
const MAX_JOB_CHARS = 6000;
const FETCH_TIMEOUT_MS = 45000;

async function callLLM(apiKey: string, prompt: string, model: string, supabaseUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

=======
const MODELS = [
  "openai/gpt-oss-120b:free",
  "anthropic/claude-3-haiku:free",
  "google/gemini-pro-1.5-flash",
  "meta-llama/llama-3-70b-instruct",
  "mistralai/mixtral-8x7b-instruct",
];

async function callLLM(apiKey: string, prompt: string, model: string, supabaseUrl: string): Promise<string> {
>>>>>>> C:/Users/SANKET/.windsurf/worktrees/skillmirrorai/skillmirrorai-67f7d5fc/supabase/functions/analyze-resume/index.ts
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": supabaseUrl,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a career analysis AI. Return ONLY valid JSON. No markdown formatting." },
        { role: "user", content: prompt },
      ],
<<<<<<< C:/Users/SANKET/skillmirrorai/supabase/functions/analyze-resume/index.ts
      temperature: 0.2,
      max_tokens: 900,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

=======
    }),
  });

>>>>>>> C:/Users/SANKET/.windsurf/worktrees/skillmirrorai/skillmirrorai-67f7d5fc/supabase/functions/analyze-resume/index.ts
  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("rate_limit");
    if (status === 402) throw new Error("credits_exhausted");
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

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const safeResumeText = resumeText.slice(0, MAX_RESUME_CHARS);
    const safeJobDescription = typeof jobDescription === "string" ? jobDescription.slice(0, MAX_JOB_CHARS) : jobDescription;

    const prompt = `You are an expert career analyst AI. Analyze the following resume against the job description provided.

Resume Text:
${safeResumeText}

${safeJobDescription ? `Job Description:\n${safeJobDescription}` : "No specific job description provided. Do a general career analysis."}

${targetRole ? `Target Job Role: ${targetRole}` : ""}
${location ? `Preferred Location: ${location}` : ""}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "profileSummary": "2-3 sentence professional summary",
  "coreSkills": ["skill1", "skill2"],
  "softSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "matchScore": 75,
  "ATSScore": 70,
  "careerLevel": "Junior|Mid|Senior|Lead",
  "suggestedCareerFields": ["field1", "field2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvementSuggestions": ["suggestion1", "suggestion2"],
  "suggestedProjects": [{"title": "Project Name", "description": "Brief description"}],
  "certifications": ["cert1", "cert2"],
  "marketDemandLevel": "High|Medium|Low",
  "estimatedSalaryRange": "$XX,000 - $XX,000",
  "thirtyDayRoadmap": [{"week": 1, "tasks": ["task1", "task2"]}, {"week": 2, "tasks": ["task1"]}, {"week": 3, "tasks": ["task1"]}, {"week": 4, "tasks": ["task1"]}],
  "resumeRewriteSuggestions": ["suggestion1", "suggestion2"],
  "jobSearchKeywords": ["keyword1", "keyword2"],
  "relatedJobTitles": [{"title": "Job Title", "description": "Brief description"}],
  "keyActions": ["action1", "action2", "action3"],
  "skillsToFocus": ["skill1", "skill2", "skill3"],
  "bestCareerDirection": "One sentence direction",
  "riskFactors": ["risk1", "risk2"]
}`;

    let content = "";
<<<<<<< C:/Users/SANKET/skillmirrorai/supabase/functions/analyze-resume/index.ts
    try {
      content = await callLLM(OPENROUTER_API_KEY, prompt, DEFAULT_MODEL, Deno.env.get("SUPABASE_URL") || "");
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

=======
    let lastError = "";
    
    for (const model of MODELS) {
      try {
        content = await callLLM(OPENROUTER_API_KEY, prompt, model, Deno.env.get("SUPABASE_URL") || "");
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Unknown error";
        console.log(`Model ${model} failed: ${lastError}, trying next...`);
        continue;
      }
    }

    if (!content) {
      throw new Error("All LLM models failed. Please try again later.");
    }

>>>>>>> C:/Users/SANKET/.windsurf/worktrees/skillmirrorai/skillmirrorai-67f7d5fc/supabase/functions/analyze-resume/index.ts
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
