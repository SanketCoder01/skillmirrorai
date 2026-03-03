import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

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

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const prompt = `You are a professional resume writer who helps people get better job opportunities.

Your task is to rewrite resumes to match job descriptions better while keeping everything honest and natural.

INPUTS:
1. Resume (uploaded)
2. Full Job Description (mandatory)

OBJECTIVE:
Rewrite the resume to:
• Match the job requirements better
• Sound professional but natural
• Use simple, everyday language
• Keep everything 100% honest (no lying)
• Make it easier for recruiters to understand

----------------------------------------
HOW TO WRITE BULLET POINTS:
----------------------------------------

Use natural, simple language like a normal person would talk:

GOOD examples:
• "I built a website using React and Node.js"
• "I helped customers solve their problems on the phone"
• "I worked with a team to launch a new app"
• "I learned how to use databases and APIs"

BAD examples (too fancy/AI-sounding):
• "Architected and deployed scalable full-stack application leveraging React and Node.js"
• "Demonstrated exceptional customer service acumen in high-volume call center environment"
• "Collaborated synergistically with cross-functional team to orchestrate mobile application launch"
• "Mastered relational database management and RESTful API implementation"

Keep it simple and direct. Use "I" statements when possible. Avoid fancy words.

----------------------------------------
PHASE 1: JOB ANALYSIS
----------------------------------------

Find these things in the job description:
• Required skills and technologies
• Experience level needed
• Key responsibilities
• Important keywords

----------------------------------------
PHASE 2: RESUME ANALYSIS
----------------------------------------

Compare what the person has vs what the job wants:
• Skills they have that match
• Skills they don't have but could learn
• Experience gaps

----------------------------------------
PHASE 3: REWRITE RULES
----------------------------------------

Make the resume better by:
• Using simple, clear language
• Adding relevant keywords naturally
• Focusing on what they actually did
• Keeping everything honest
• Making it easy to read

----------------------------------------
PHASE 4: OUTPUT FORMAT
----------------------------------------

Return this information:

1. ATS Match Score (Estimated %)
2. Keyword Match Breakdown
3. Gaps Identified
4. Rewritten Resume (Full Optimized Version)
5. Interview Strength Analysis
6. Suggestions to Further Improve Selection Chances

Important Rules:
• Don't make up fake companies or jobs
• Don't add fake years of experience
• Don't use buzzwords like "synergistic" or "orchestrate"
• Use normal, everyday language
• Keep resume clean and professional
• Use 3 bullet points maximum per job/project
• Keep total resume to 1-2 pages

Tone:
Friendly, professional, straightforward. Write like a normal person, not a robot.

----------------------------------------
CRITICAL ALIGNMENT ENFORCEMENT
----------------------------------------

After rewriting the resume, perform a strict alignment check against the Job Description.

1. If the JD mentions specific technologies (e.g., Node.js, Express.js, MongoDB, React, Angular, PostgreSQL, REST API, etc.):

   • Ensure they appear naturally in:
     - Experience section
     - Projects section
     - Skills section

   • If the candidate has related experience but not explicitly stated,
     reposition and rephrase it clearly.

   • If candidate is still learning but has basic exposure,
     phrase it as:
     "Built basic REST APIs using Node.js and Express.js"
     NOT "Node.js (learning)"

2. If JD requires:
   • Performance optimization → Add experience about query optimization, reducing load time, caching, or API efficiency.
   • Security → Add input validation, authentication, role-based access, or secure API handling.
   • Scalability → Add handling of multiple users, modular architecture, or optimized database structure.
   • Agile → Add sprint collaboration, stand-ups, code reviews.
   • Debugging & maintenance → Add bug fixing, troubleshooting, upgrading legacy code.

3. If JD is for small/mid-size company:
   • Make tone practical and reliability-focused.
   • Emphasize hands-on development and maintenance.
   • Avoid over-startup/AI-heavy positioning.

4. If JD is startup-focused:
   • Emphasize ownership, end-to-end feature building, fast iteration.
   • Highlight independent problem-solving and product thinking.

5. Ensure backend depth is clear if backend is required:
   • Mention API design
   • CRUD operations
   • Authentication
   • Database schema design
   • Query optimization

6. Ensure frontend depth is clear if frontend is required:
   • Responsive UI
   • Component-based architecture
   • State management
   • Performance improvements

7. Never fabricate:
   • Fake companies
   • Fake years
   • Fake advanced expertise

Instead, strengthen positioning of existing real work.

----------------------------------------
FINAL VALIDATION
----------------------------------------

Before final output:
• Check that every major requirement from JD appears at least once in resume.
• Remove unrelated heavy focus (e.g., AI if JD is pure web development).
• Ensure resume feels custom-written for THIS job.

Resume Text:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON (no markdown, no code fences) with this EXACT structure:
{
  "ats_match_score": number (0-100),
  "keyword_match_breakdown": {
    "core_skills_matched": ["skill1", "skill2"],
    "secondary_skills_matched": ["skill1", "skill2"],
    "tools_matched": ["tool1", "tool2"],
    "keywords_integrated": ["keyword1", "keyword2"],
    "match_percentage": number
  },
  "gaps_identified": {
    "matched_skills": ["skill1", "skill2"],
    "partially_matched_skills": [{"skill": "name", "gap": "what's missing"}],
    "missing_but_learnable": ["skill1", "skill2"],
    "completely_missing_critical": ["skill1", "skill2"]
  },
  "optimized_summary": "2-3 line professional summary with key skills",
  "optimized_experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Duration",
      "bullets": ["Simple bullet point 1", "Simple bullet point 2", "Simple bullet point 3"]
    }
  ],
  "optimized_projects": [
    {
      "name": "Project Name",
      "tech_stack": ["tech1", "tech2"],
      "bullets": ["Simple bullet point 1", "Simple bullet point 2", "Simple bullet point 3"]
    }
  ],
  "optimized_skills": {
    "Frontend": ["skill1", "skill2"],
    "Backend": ["skill1", "skill2"],
    "Database": ["skill1", "skill2"],
    "Cloud_DevOps": ["skill1", "skill2"],
    "Tools": ["skill1", "skill2"],
    "AI_ML": ["skill1", "skill2"],
    "Soft_Skills": ["skill1", "skill2"]
  },
  "interview_strength_analysis": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "overall_impression": "Strong/Moderate/Needs Work",
    "interview_probability": number (0-100)
  },
  "improvement_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "full_optimized_resume": "Complete formatted resume text. Use simple, natural language for all bullet points. Keep it professional but conversational. Include: Name, Contact, Summary (2-3 lines), Experience (3 bullets each), Projects (3 bullets each), Skills (categorized), Education."
}`;

  const systemPrompt = "You are an elite resume optimization engine. You maximize interview shortlisting probability while maintaining 100% honesty. Return ONLY valid JSON with all requested keys. No markdown.";
    
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
    console.error("rewrite-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
