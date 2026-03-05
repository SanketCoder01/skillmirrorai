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

    const { resumeText, resumeUrl, jobDescription, targetRole, location } = await req.json();
    
    let finalResumeText = resumeText;
    
    // If no text provided but URL is available, fetch and parse PDF
    if (!finalResumeText && resumeUrl) {
      console.log("No text provided, fetching from URL:", resumeUrl);
      try {
        const pdfResponse = await fetch(resumeUrl);
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          // Simple text extraction - try to get readable content
          const decoder = new TextDecoder("utf-8", { fatal: false });
          const rawText = decoder.decode(pdfBuffer);
          // Clean up binary artifacts and extract readable text
          finalResumeText = rawText
            .replace(/[^\x20-\x7E\n\r\t]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          console.log("Extracted text length from PDF:", finalResumeText.length);
        }
      } catch (fetchError) {
        console.error("Failed to fetch PDF:", fetchError);
      }
    }
    
    if (!finalResumeText || typeof finalResumeText !== "string" || finalResumeText.length < 50) {
      return new Response(JSON.stringify({ error: "Could not extract resume text. Please ensure PDF has selectable text." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const safeResumeText = finalResumeText.slice(0, MAX_RESUME_CHARS);
    const safeJobDescription = typeof jobDescription === "string" ? jobDescription.slice(0, MAX_JOB_CHARS) : jobDescription;

    const prompt = `Analyze this resume and return ONLY JSON (no markdown):

Resume:
${safeResumeText}

${safeJobDescription ? `Job Description:\n${safeJobDescription}` : ""}

Return this JSON structure:
{
  "profileSummary": "2-3 sentence summary in simple language",
  "coreSkills": ["skill1", "skill2"],
  "softSkills": ["skill1"],
  "missingSkills": ["skill1"],
  "matchScore": 75,
  "ATSScore": 70,
  "careerLevel": "Junior|Mid|Senior",
  "suggestedCareerFields": ["Field1", "Field2"],
  "strengths": ["strength1 in simple language", "strength2 in simple language", "strength3 in simple language"],
  "weaknesses": ["area1 in simple language", "area2 in simple language", "area3 in simple language"],
  "improvementSuggestions": ["suggestion1", "suggestion2"],
  "suggestedProjects": [{"title": "Project Name", "description": "Brief description"}, {"title": "Project 2", "description": "Brief description"}, {"title": "Project 3", "description": "Brief description"}],
  "certifications": ["Certification1", "Certification2"],
  "marketDemandLevel": "High|Medium|Low",
  "estimatedSalaryRange": "₹3,00,000 - ₹6,00,000",
  "thirtyDayRoadmap": [{"week": 1, "tasks": ["task1", "task2"]}, {"week": 2, "tasks": ["task1"]}, {"week": 3, "tasks": ["task1"]}, {"week": 4, "tasks": ["task1"]}],
  "resumeRewriteSuggestions": ["tip1", "tip2"],
  "jobSearchKeywords": ["keyword1"],
  "relatedJobTitles": [{"title": "Real Job Title", "description": "Brief description of role"}, {"title": "Real Job Title 2", "description": "Brief description"}, {"title": "Real Job Title 3", "description": "Brief description"}],
  "keyActions": ["action1", "action2"],
  "skillsToFocus": ["skill1", "skill2"],
  "bestCareerDirection": "Clear career direction recommendation",
  "riskFactors": ["risk1", "risk2"],
  "skillCategories": {"category1": 30, "category2": 25, "category3": 20, "category4": 15, "category5": 10},
  "skillProficiency": {"skill1": 9, "skill2": 8, "skill3": 7},
  "experience": {"internships": 0, "freelance": 0, "fullTime": 0, "academicProjects": 0, "totalYears": 0}
}

CRITICAL RULES:
- Analyze the ACTUAL resume content - do NOT assume any specific industry or profession
- If resume is for a teacher, analyze teaching skills, NOT coding skills
- If resume is for a doctor, analyze medical skills, NOT coding skills
- Extract skills that are ACTUALLY mentioned or clearly implied in the resume
- skillCategories should be RELEVANT to the profession (e.g., for teacher: "Teaching Methods", "Curriculum Design", "Student Engagement", "Assessment", "Communication")
- skillProficiency should list actual skills from the resume with proficiency scores 1-10
- Exactly 3 strengths in simple, easy-to-understand language
- Exactly 3 areas of improvement (weaknesses) in simple language
- At least 2 improvement suggestions
- Exactly 3 suggested projects relevant to the profession
- Exactly 3 real job titles that match the resume profile
- Be concise. Estimate scores 0-100. Include 4 weeks in roadmap with 2-3 tasks each.`;

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
      resume_text: finalResumeText?.substring(0, 5000),
      job_description: jobDescription?.substring(0, 3000),
      target_role: targetRole,
      location: location,
      results_json: results,
      match_score: results.matchScore || 0,
      analysis_status: "done",
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
