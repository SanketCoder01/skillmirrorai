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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { resumeText, jobDescription, targetRole, location } = await req.json();

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const prompt = `You are an expert career analyst AI. Analyze the following resume against the job description provided.

Resume Text:
${resumeText}

${jobDescription ? `Job Description:\n${jobDescription}` : "No specific job description provided. Do a general career analysis."}

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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-preview",
        messages: [
          { role: "system", content: "You are a career analysis AI. Return ONLY valid JSON. No markdown formatting." },
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
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let results;
    try {
      results = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI returned invalid JSON");
    }

    // Save to database
    const { error: insertError } = await supabase.from("analyses").insert({
      user_id: user.id,
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
