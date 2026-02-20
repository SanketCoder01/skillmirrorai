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

    const prompt = `You are a SENIOR TECHNICAL RECRUITER with 15+ years of experience and deep expertise in ATS (Applicant Tracking System) analysis.

Analyze the following resume SPECIFICALLY for the role of "${targetRole}".

Resume Text:
${resumeText}

CRITICAL INSTRUCTIONS:
1. Calculate a REAL, ACCURATE ATS score based on actual keyword matching against the "${targetRole}" role requirements
2. Do NOT give inflated scores. Be honest and precise like a real ATS system would be
3. Compare against actual industry-standard skill requirements for "${targetRole}"
4. Analyze each section independently: summary, skills, experience, education, formatting
5. Think like a recruiter: what would make you reject or shortlist this resume?

SCORING RULES:
- Count exact keyword matches vs required keywords for "${targetRole}"
- Penalize for: missing critical skills, poor formatting, lack of quantification, irrelevant content
- Reward for: strong action verbs, quantified achievements, role-aligned keywords, clean formatting
- ATS score must reflect REAL compatibility, not encouragement

Return ONLY valid JSON (no markdown, no code fences):
{
  "ats_score": 72,
  "matching_skills": ["React", "Node.js", "TypeScript"],
  "missing_skills": ["Docker", "REST API", "CI/CD"],
  "remove_suggestions": ["IoT experiments (irrelevant for ${targetRole})", "Unrelated hobby projects"],
  "improvement_tips": ["Add measurable achievements with numbers", "Include more role-specific keywords in summary", "Use action verbs at the start of bullet points"],
  "summary_feedback": "Specific, actionable feedback about this resume's ATS compatibility for ${targetRole}. Be direct and professional.",
  "weak_sections": ["Summary is too generic for ${targetRole}", "Skills section lacks organization"],
  "keyword_density": {"present": 65, "optimal": 85, "suggestion": "Add 8-10 more relevant keywords for ${targetRole}"},
  "formatting_issues": ["Use consistent date format", "Add more white space between sections"],
  "section_scores": {"summary": 60, "skills": 75, "experience": 70, "education": 80, "overall_format": 65}
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
