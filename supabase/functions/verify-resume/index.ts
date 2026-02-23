import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";

interface VerificationResult {
  overall_score: number;
  authenticity_score: number;
  formatting_score: number;
  content_quality_score: number;
  skills_detected: string[];
  experience_summary: {
    total_years: number;
    companies: string[];
    roles: string[];
  };
  education: {
    degrees: string[];
    institutions: string[];
  };
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  red_flags: string[];
  strengths: string[];
  recommendations: string[];
  is_verified: boolean;
  verification_level: "verified" | "partially_verified" | "needs_review";
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { resumeText, userId, fileName, fileUrl } = await req.json();

    if (!resumeText || typeof resumeText !== "string") {
      return new Response(
        JSON.stringify({ error: "Resume text is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Build AI prompt for resume verification
    const prompt = `You are an expert resume verification system, senior technical recruiter, and HR professional with 15+ years of experience.

You will receive a resume text extracted from a PDF. Your job is to deeply analyze it for authenticity, quality, and professional presentation.

NON-NEGOTIABLE RULES:
1. Be realistic and fair. Do not penalize junior candidates for limited experience.
2. Do NOT hallucinate information not present in the resume.
3. Identify actual skills, technologies, and tools mentioned.
4. Detect potential red flags (gaps, inconsistencies, vague descriptions, unrealistic claims).
5. Provide constructive, actionable recommendations.

TASK 1: Extract Information
- Extract all technical skills, tools, and technologies mentioned
- Extract companies worked at and roles held
- Calculate total years of experience
- Extract education details (degrees, institutions, years)
- Extract projects with descriptions and technologies used

TASK 2: Authenticity Analysis
- Check for realistic career progression
- Identify vague or suspicious claims
- Look for quantifiable achievements vs empty claims
- Detect formatting inconsistencies that may indicate tampering
- Check for realistic skill-to-experience correlation

TASK 3: Content Quality Analysis
- Evaluate clarity and professionalism of descriptions
- Check for action verbs and impact statements
- Assess project descriptions quality
- Evaluate education presentation

TASK 4: Formatting Analysis
- Check for ATS-friendly formatting
- Identify potential parsing issues
- Evaluate section organization

TASK 5: Scoring
- Authenticity Score (0-100): How genuine and believable is the resume?
- Formatting Score (0-100): Is it well-formatted and ATS-friendly?
- Content Quality Score (0-100): Are descriptions clear and impactful?
- Overall Score (weighted average with authenticity having highest weight)

Resume Text:
${resumeText}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "overall_score": 0,
  "authenticity_score": 0,
  "formatting_score": 0,
  "content_quality_score": 0,
  "skills_detected": [""],
  "experience_summary": {
    "total_years": 0,
    "companies": [""],
    "roles": [""]
  },
  "education": {
    "degrees": [""],
    "institutions": [""]
  },
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [""]
    }
  ],
  "red_flags": [""],
  "strengths": [""],
  "recommendations": [""],
  "is_verified": true,
  "verification_level": "verified"
}

Scoring Guidelines:
- overall_score >= 75: is_verified = true, verification_level = "verified"
- overall_score >= 50: is_verified = false, verification_level = "partially_verified"
- overall_score < 50: is_verified = false, verification_level = "needs_review"

Be thorough but fair. A fresh graduate with limited experience should not be penalized if their resume is well-constructed.`;

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://skillmirror.ai",
        "X-Title": "SkillMirror Resume Verifier",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let results: VerificationResult;
    try {
      // Remove potential markdown code fences
      const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
      results = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      throw new Error("Failed to parse verification results");
    }

    // Validate and sanitize results
    results.overall_score = Math.min(100, Math.max(0, results.overall_score || 0));
    results.authenticity_score = Math.min(100, Math.max(0, results.authenticity_score || 0));
    results.formatting_score = Math.min(100, Math.max(0, results.formatting_score || 0));
    results.content_quality_score = Math.min(100, Math.max(0, results.content_quality_score || 0));
    results.skills_detected = results.skills_detected || [];
    results.experience_summary = results.experience_summary || { total_years: 0, companies: [], roles: [] };
    results.education = results.education || { degrees: [], institutions: [] };
    results.projects = results.projects || [];
    results.red_flags = results.red_flags || [];
    results.strengths = results.strengths || [];
    results.recommendations = results.recommendations || [];
    
    // Determine verification level based on score
    if (results.overall_score >= 75) {
      results.is_verified = true;
      results.verification_level = "verified";
    } else if (results.overall_score >= 50) {
      results.is_verified = false;
      results.verification_level = "partially_verified";
    } else {
      results.is_verified = false;
      results.verification_level = "needs_review";
    }

    return new Response(
      JSON.stringify({ results }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Verification failed" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
