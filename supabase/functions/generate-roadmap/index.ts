import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";

interface Milestone {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: "completed" | "in_progress" | "pending";
  tasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

interface RoadmapData {
  target_role: string;
  current_level: string;
  experience_level: string;
  total_duration: string;
  milestones: Milestone[];
  skills_to_learn: string[];
  resources: {
    title: string;
    url: string;
    type: "course" | "book" | "project" | "certification";
  }[];
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
    const { targetRole, currentLevel, experienceLevel, timeCommitment } = await req.json();

    if (!targetRole) {
      return new Response(
        JSON.stringify({ error: "Target role is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const prompt = `You are an expert career coach and technical mentor.

Create a detailed, actionable career roadmap for someone who wants to become a ${targetRole}.

Current Level: ${currentLevel || "Beginner"}
Experience: ${experienceLevel || "Fresher"}
Time Commitment: ${timeCommitment || "Part-time (10 hrs/week)"}

Create a realistic learning path with:
1. 5-7 milestones that progressively build skills
2. Each milestone should have 3-5 specific tasks
3. Estimate realistic durations based on time commitment
4. Include specific resources (real courses, books, projects)
5. Focus on practical, hands-on learning

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "target_role": "${targetRole}",
  "current_level": "${currentLevel}",
  "experience_level": "${experienceLevel}",
  "total_duration": "X months",
  "milestones": [
    {
      "id": "m1",
      "title": "Milestone Title",
      "description": "Brief description of what will be learned",
      "duration": "X weeks",
      "status": "pending",
      "tasks": [
        {
          "id": "t1",
          "title": "Task description",
          "completed": false
        }
      ]
    }
  ],
  "skills_to_learn": ["skill1", "skill2"],
  "resources": [
    {
      "title": "Resource Name",
      "url": "https://actual-url.com",
      "type": "course"
    }
  ]
}

Make the roadmap comprehensive but achievable. Include real, popular resources like:
- FreeCodeCamp, Coursera, Udemy courses
- Official documentation
- Popular GitHub projects
- Industry certifications

For a ${experienceLevel} targeting ${targetRole}, ensure the starting point is appropriate.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://skillmirror.ai",
        "X-Title": "SkillMirror Roadmap Generator",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
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
    let roadmap: RoadmapData;
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
      roadmap = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      throw new Error("Failed to parse roadmap data");
    }

    // Validate and set defaults
    roadmap.target_role = roadmap.target_role || targetRole;
    roadmap.current_level = roadmap.current_level || currentLevel;
    roadmap.experience_level = roadmap.experience_level || experienceLevel;
    roadmap.total_duration = roadmap.total_duration || "6 months";
    roadmap.milestones = roadmap.milestones || [];
    roadmap.skills_to_learn = roadmap.skills_to_learn || [];
    roadmap.resources = roadmap.resources || [];

    // Ensure all milestones have required fields
    roadmap.milestones = roadmap.milestones.map((m, idx) => ({
      id: m.id || `m${idx + 1}`,
      title: m.title || `Milestone ${idx + 1}`,
      description: m.description || "",
      duration: m.duration || "2 weeks",
      status: m.status || "pending",
      tasks: (m.tasks || []).map((t, tIdx) => ({
        id: t.id || `t${idx + 1}_${tIdx + 1}`,
        title: t.title || `Task ${tIdx + 1}`,
        completed: t.completed || false,
      })),
    }));

    return new Response(
      JSON.stringify({ roadmap }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Roadmap generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Generation failed" }),
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
