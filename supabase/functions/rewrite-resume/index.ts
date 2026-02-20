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

    const prompt = `You are a SENIOR RESUME OPTIMIZATION SPECIALIST who thinks like a professional recruiter.

CRITICAL RULES - READ CAREFULLY:
1. Do NOT add fake experience or skills the candidate doesn't have
2. Only optimize and rephrase EXISTING content
3. If a section is ALREADY STRONG, say so. Do NOT suggest unnecessary changes
4. Use SIMPLE, EASY-TO-READ language. No complex vocabulary
5. Think like a recruiter: what changes would actually move this resume from "maybe" to "interview"?
6. Be specific. "Add metrics" is generic. "Change 'managed team' to 'Led 8-person development team delivering 3 projects ahead of schedule'" is specific
7. Only suggest improvements that would increase resume strength by 10%+ 
8. Remove irrelevant content that doesn't match the job description

SMART FILTERING RULES:
- If summary already targets the role well → say "Your summary is well-aligned. No major changes needed."
- If experience bullets already have metrics → don't suggest adding metrics to those bullets
- If skills section already matches job keywords → acknowledge it, don't suggest redundant additions
- Focus ONLY on what genuinely needs improvement

Resume Text:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON (no markdown, no code fences):
{
  "optimized_summary": "A rewritten professional summary in simple, clear language. Or 'Your current summary is strong and well-aligned with this role.' if already good",
  "optimized_skills": ["Skill 1 (reordered/rephrased for relevance)", "Skill 2"],
  "optimized_experience": [
    {
      "original": "Original bullet point from resume",
      "optimized": "Rewritten with relevant keywords and metrics in simple language. If already strong, write 'No change needed - already well-written'"
    }
  ],
  "added_keywords": ["keyword1", "keyword2"],
  "removed_content": ["Irrelevant item 1", "Irrelevant item 2"],
  "missing_from_resume": ["Critical gap 1 - specific and actionable"],
  "optimization_score": {"before": 55, "after": 82},
  "tone_feedback": "Professional, specific feedback about the overall tone and impact",
  "additional_tips": ["Only actionable, specific tips that make real difference"],
  "full_optimized_resume": "The complete rewritten resume text in clean format without any markdown. Use simple professional language throughout."
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
          { role: "system", content: "You are a senior resume optimization specialist. Think like a recruiter. Return ONLY valid JSON. No markdown. Use simple, clear, easy-to-read language. Do NOT suggest changes when content is already strong. Be specific, not generic." },
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
