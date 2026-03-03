import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GROQ_MODEL = "openai/gpt-oss-120b";

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

async function callGroqLLM(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
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
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

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

    const prompt = `You are a career roadmap generator. Create a simple learning roadmap for becoming a ${targetRole}.

Return ONLY this exact JSON structure (no markdown, no explanations):

{
  "target_role": "${targetRole}",
  "total_duration": "6 months",
  "milestones": [
    {
      "id": "m1",
      "title": "Learn Basics",
      "duration": "4 weeks",
      "status": "pending",
      "tasks": [
        {
          "id": "t1",
          "title": "Complete basic tutorials",
          "completed": false
        }
      ]
    },
    {
      "id": "m2", 
      "title": "Build Projects",
      "duration": "4 weeks",
      "status": "pending",
      "tasks": [
        {
          "id": "t2",
          "title": "Create portfolio projects",
          "completed": false
        }
      ]
    },
    {
      "id": "m3",
      "title": "Advanced Skills",
      "duration": "4 weeks", 
      "status": "pending",
      "tasks": [
        {
          "id": "t3",
          "title": "Learn advanced concepts",
          "completed": false
        }
      ]
    },
    {
      "id": "m4",
      "title": "Job Preparation",
      "duration": "4 weeks",
      "status": "pending", 
      "tasks": [
        {
          "id": "t4",
          "title": "Prepare for interviews",
          "completed": false
        }
      ]
    }
  ],
  "skills_to_learn": ["HTML", "CSS", "JavaScript"],
  "resources": [
    {
      "title": "FreeCodeCamp",
      "url": "https://freecodecamp.org",
      "type": "course"
    }
  ]
}

Do NOT add extra fields or change this structure. Return ONLY the JSON.`;

    // For now, use a static roadmap generator to ensure it works
    // TODO: Fix AI JSON generation issue
    const roadmap: RoadmapData = {
      target_role: targetRole,
      current_level: currentLevel || "Beginner",
      experience_level: experienceLevel || "Fresher",
      time_commitment: timeCommitment || "Part-time (10 hrs/week)",
      total_duration: "6 months",
      role_overview: {
        what_this_role_does: `${targetRole} develops software applications, websites, and systems using programming languages and tools.`,
        companies_that_hire: ["Tech companies", "Startups", "Consulting firms", "Product companies"]
      },
      final_career_outcome: {
        can_build: [`Full-stack ${targetRole} applications`, "Portfolio websites", "API integrations"],
        can_apply_for: [`Junior ${targetRole}`, `Associate ${targetRole}`, `${targetRole} Developer`],
        interview_level: "Fresher to Mid-level"
      },
      milestones: [
        {
          id: "m1",
          title: "Foundation Building",
          phase: "Phase 1 - Month 1-2",
          duration: "8 weeks",
          status: "pending",
          goal: "Learn the fundamental concepts and basic skills needed for development",
          skills_to_learn: [
            { skill: "Programming Fundamentals", explanation: "Learn variables, loops, functions, and basic logic" },
            { skill: "HTML & CSS", explanation: "Create and style web pages" },
            { skill: "Version Control", explanation: "Use Git for code management" }
          ],
          what_you_can_do: ["Build simple static websites", "Write basic programs", "Use Git for version control"],
          mini_project: {
            title: "Personal Portfolio Website",
            description: "Create a simple website showcasing your skills",
            technologies: ["HTML", "CSS", "Git"]
          },
          deliverable: "A working portfolio website deployed online",
          how_to_know_ready: "You can build and deploy a simple website without help",
          resources: [
            { title: "FreeCodeCamp HTML/CSS", url: "https://freecodecamp.org/learn/responsive-web-design", type: "course", is_free: true },
            { title: "MDN Web Docs", url: "https://developer.mozilla.org", type: "documentation", is_free: true }
          ],
          important_tip: "Don't skip the basics - they are crucial for everything that follows",
          tasks: [
            { id: "t1_1", title: "Complete HTML/CSS tutorials", completed: false },
            { id: "t1_2", title: "Learn Git basics", completed: false },
            { id: "t1_3", title: "Build and deploy portfolio site", completed: false }
          ]
        },
        {
          id: "m2",
          title: "Core Development Skills",
          phase: "Phase 2 - Month 3-4",
          duration: "8 weeks",
          status: "pending",
          goal: "Master the main programming language and frameworks for your role",
          skills_to_learn: [
            { skill: "JavaScript/Node.js", explanation: "Learn JavaScript programming and backend development" },
            { skill: "Database Basics", explanation: "Understand how to store and retrieve data" },
            { skill: "API Development", explanation: "Create and consume web APIs" }
          ],
          what_you_can_do: ["Build full-stack applications", "Create REST APIs", "Work with databases"],
          mini_project: {
            title: "Task Management App",
            description: "Build a full-stack application with user authentication",
            technologies: ["JavaScript", "Node.js", "MongoDB", "Express"]
          },
          deliverable: "A complete web application with database and API",
          how_to_know_ready: "You can build and deploy a full-stack application",
          resources: [
            { title: "Node.js Documentation", url: "https://nodejs.org/docs", type: "documentation", is_free: true },
            { title: "MongoDB University", url: "https://university.mongodb.com", type: "course", is_free: true }
          ],
          important_tip: "Focus on understanding concepts rather than just copying code",
          tasks: [
            { id: "t2_1", title: "Master JavaScript fundamentals", completed: false },
            { id: "t2_2", title: "Learn backend development", completed: false },
            { id: "t2_3", title: "Build full-stack project", completed: false }
          ]
        },
        {
          id: "m3",
          title: "Advanced Topics",
          phase: "Phase 3 - Month 5-6",
          duration: "8 weeks",
          status: "pending",
          goal: "Learn advanced concepts and best practices",
          skills_to_learn: [
            { skill: "Testing", explanation: "Write tests for your code" },
            { skill: "Deployment", explanation: "Deploy applications to production" },
            { skill: "Security Basics", explanation: "Implement basic security measures" }
          ],
          what_you_can_do: ["Write automated tests", "Deploy apps to cloud", "Implement security best practices"],
          mini_project: {
            title: "E-commerce Platform",
            description: "Build a complete e-commerce application with payment integration",
            technologies: ["React", "Node.js", "PostgreSQL", "Stripe API"]
          },
          deliverable: "A production-ready e-commerce application",
          how_to_know_ready: "You can deploy and maintain a complex application",
          resources: [
            { title: "Jest Testing", url: "https://jestjs.io/docs/getting-started", type: "documentation", is_free: true },
            { title: "Heroku Deployment", url: "https://devcenter.heroku.com", type: "documentation", is_free: true }
          ],
          important_tip: "Security should be considered from the beginning, not added later",
          tasks: [
            { id: "t3_1", title: "Learn testing frameworks", completed: false },
            { id: "t3_2", title: "Master deployment processes", completed: false },
            { id: "t3_3", title: "Build advanced project", completed: false }
          ]
        },
        {
          id: "m4",
          title: "Interview Preparation",
          phase: "Phase 4 - Month 6-7",
          duration: "4 weeks",
          status: "pending",
          goal: "Prepare for technical interviews and job applications",
          skills_to_learn: [
            { skill: "Data Structures", explanation: "Learn common data structures used in interviews" },
            { skill: "Algorithms", explanation: "Practice algorithmic problem solving" },
            { skill: "System Design", explanation: "Learn to design scalable systems" }
          ],
          what_you_can_do: ["Solve coding problems", "Design system architectures", "Ace technical interviews"],
          mini_project: {
            title: "Interview Practice",
            description: "Solve 50+ coding problems and system design questions",
            technologies: ["JavaScript", "Data Structures", "Algorithms"]
          },
          deliverable: "Strong portfolio and interview skills",
          how_to_know_ready: "You can solve most coding interview questions",
          resources: [
            { title: "LeetCode", url: "https://leetcode.com", type: "platform", is_free: true },
            { title: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", type: "documentation", is_free: true }
          ],
          important_tip: "Practice explaining your solutions out loud, not just writing code",
          tasks: [
            { id: "t4_1", title: "Solve 50+ coding problems", completed: false },
            { id: "t4_2", title: "Practice system design", completed: false },
            { id: "t4_3", title: "Mock interviews", completed: false }
          ]
        }
      ],
      real_world_practice: {
        open_source_suggestion: "Contribute to open source projects on GitHub to gain real-world experience",
        portfolio_requirement: "Include 3-4 strong projects in your portfolio",
        github_requirement: "Maintain an active GitHub profile with regular commits",
        resume_readiness: "Tailor your resume for each job application, highlighting relevant skills and projects"
      },
      interview_preparation: {
        dsa_practice: {
          platforms: ["LeetCode", "HackerRank", "CodeChef"],
          topics_to_focus: ["Arrays", "Strings", "Linked Lists", "Trees", "Dynamic Programming"],
          problems_to_solve: 100
        },
        system_design_basics: {
          needed: true,
          topics: ["Load Balancing", "Caching", "Database Design", "API Design", "Scalability"]
        },
        mock_interview: {
          platforms: ["Pramp", "Interviewing.io", "CodeSignal"],
          frequency: "2-3 times per week"
        }
      },
      deployment_job_phase: {
        how_to_deploy: "1. Choose a cloud platform (Heroku, Vercel, AWS), 2. Set up CI/CD pipeline, 3. Configure environment variables, 4. Monitor performance",
        resume_tips: ["Quantify achievements", "Use action verbs", "Tailor for each job", "Include relevant keywords"],
        job_application_strategy: "Apply to 10 jobs per week, network on LinkedIn, attend meetups, contribute to open source"
      },
      skills_to_learn: ["HTML", "CSS", "JavaScript", "Node.js", "React", "Databases", "APIs", "Testing", "Deployment", "Git"],
      resources: [
        { title: "FreeCodeCamp", url: "https://freecodecamp.org", type: "course" },
        { title: "MDN Web Docs", url: "https://developer.mozilla.org", type: "documentation" },
        { title: "Node.js Docs", url: "https://nodejs.org/docs", type: "documentation" },
        { title: "LeetCode", url: "https://leetcode.com", type: "platform" },
        { title: "GitHub", url: "https://github.com", type: "platform" }
      ]
    };

    // Try AI generation first, fallback to static if it fails
    try {
      content = await callGroqLLM(GROQ_API_KEY, prompt);
      console.log("Raw AI response:", content.substring(0, 500));
      const aiRoadmap = JSON.parse(content);
      // Merge AI response with our structure if it works
      Object.assign(roadmap, aiRoadmap);
    } catch (aiError) {
      console.log("AI generation failed, using static roadmap:", aiError);
      // Use the static roadmap we created above
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
