import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_MODEL = "llama-3.3-70b-versatile"; // Faster model for quick analysis
const MAX_RESUME_CHARS = 8000; // Reduced for faster processing
const FETCH_TIMEOUT_MS = 45000; // Reduced timeout

// PDF text extraction using pdf.js
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // Use pdf.js from CDN for Deno
    const pdfjsLib = await import("https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.mjs");
    
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }
    
    return fullText.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    // Fallback: try to extract any readable text
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const text = decoder.decode(pdfBuffer);
    // Clean up binary artifacts
    return text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
  }
}

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

    const { resumeUrl, targetRole, location } = await req.json();
    
    if (!resumeUrl) {
      return new Response(JSON.stringify({ error: "Resume URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    console.log("Fetching resume from:", resumeUrl);

    // Fetch the PDF file
    const pdfResponse = await fetch(resumeUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch resume: ${pdfResponse.status}`);
    }
    
    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log("PDF size:", pdfBuffer.byteLength, "bytes");

    // Extract text from PDF
    console.log("Extracting text from PDF...");
    const resumeText = await extractTextFromPDF(pdfBuffer);
    console.log("Extracted text length:", resumeText.length, "characters");

    if (!resumeText || resumeText.length < 50) {
      throw new Error("Could not extract readable text from resume. Please ensure it's a valid PDF with selectable text.");
    }

    const safeResumeText = resumeText.slice(0, MAX_RESUME_CHARS);

    const prompt = `Analyze this resume and return ONLY JSON (no markdown):

Resume:
${safeResumeText}

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

Be concise. Estimate scores 0-100 based on resume content.`;

    console.log("Calling LLM for analysis...");
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
      throw e;
    }

    let results;
    try {
      results = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      throw new Error("AI returned invalid JSON");
    }

    console.log("Analysis complete, saving to database...");

    // Save to analyses table
    const { error: insertError } = await supabase.from("analyses").insert({
      user_id: userId,
      resume_text: resumeText.substring(0, 5000),
      target_role: targetRole,
      location: location,
      results_json: results,
      match_score: results.matchScore || results.ATSScore || 0,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
    }

    // Also update the resumes table if it exists
    const { error: resumeUpdateError } = await supabase
      .from("resumes")
      .upsert({
        user_id: userId,
        file_url: resumeUrl,
        parsed_text: resumeText.substring(0, 10000),
        skills_detected: results.coreSkills || [],
        analysis_result: results,
        is_verified: false,
        verification_score: results.matchScore || 0,
      }, { onConflict: "user_id" });

    if (resumeUpdateError) {
      console.log("Resume table update skipped:", resumeUpdateError.message);
    }

    console.log("Analysis saved successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      extractedTextLength: resumeText.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-analyze-resume error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error",
      details: e instanceof Error ? e.stack : undefined
    }), {
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
