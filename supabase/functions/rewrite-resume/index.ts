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
    const userId = claimsData.claims.sub;

    const { resumeText, jobDescription } = await req.json();
    if (!resumeText) throw new Error("Resume text is required");
    if (!jobDescription) throw new Error("Job description is required");

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const prompt = `You are an expert resume optimization specialist. Rewrite and optimize the following resume to match the given job description.

IMPORTANT RULES:
- Do NOT add fake experience or skills the candidate doesn't have
- Only optimize and rephrase existing content
- Add relevant keywords naturally from the job description
- Keep language SIMPLE and EASY TO READ - avoid complex words
- Use clear, professional but simple English
- Remove irrelevant content that doesn't match the job

Resume Text:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "optimized_summary": "A rewritten professional summary optimized for this job in simple language",
  "optimized_skills": ["Skill 1 (reordered/rephrased)", "Skill 2"],
  "optimized_experience": [
    {
      "original": "Original bullet point from resume",
      "optimized": "Rewritten bullet point with relevant keywords and metrics in simple language"
    }
  ],
  "added_keywords": ["keyword1", "keyword2"],
  "removed_content": ["Irrelevant item 1", "Irrelevant item 2"],
  "missing_from_resume": ["Critical gap 1", "Critical gap 2"],
  "optimization_score": {"before": 55, "after": 82},
  "tone_feedback": "The resume now uses stronger action verbs and includes measurable outcomes.",
  "additional_tips": ["Tip 1", "Tip 2"],
  "full_optimized_resume": "The complete rewritten resume text in clean format without any markdown"
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
          { role: "system", content: "You are a resume optimization expert. Return ONLY valid JSON. No markdown formatting. Always use simple, clear, easy-to-read language." },
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
