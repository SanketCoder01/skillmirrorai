import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GROQ_MODEL = "llama-3.3-70b-versatile";

// ============================================
// INTERFACES
// ============================================
interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface SkillItem {
  skill: string;
  explanation: string;
}

interface MiniProject {
  title: string;
  description: string;
  technologies: string[];
}

interface Resource {
  title: string;
  url: string;
  type: string;
  is_free?: boolean;
}

interface Milestone {
  id: string;
  title: string;
  phase: string;
  duration: string;
  status: "completed" | "in_progress" | "pending";
  goal: string;
  what_to_learn: string[];
  where_to_learn: Resource[];
  practice_tasks: string[];
  mini_project: MiniProject;
  skills_gained: string[];
  tasks: Task[];
}

interface RoadmapData {
  target_role: string;
  current_level: string;
  experience_level: string;
  time_commitment: string;
  total_duration: string;
  career_overview: {
    what_this_role_does: string;
    where_this_role_is_used: string;
    companies_that_hire: string[];
  };
  skills_required: {
    core_technical: string[];
    tools_and_technologies: string[];
    conceptual_knowledge: string[];
  };
  milestones: Milestone[];
  weekly_plan: {
    week: number;
    focus: string;
    tasks: string[];
  }[];
  practice_platforms: {
    name: string;
    url: string;
    how_it_helps: string;
  }[];
  project_ideas: {
    beginner: { title: string; description: string; skills_used: string[] }[];
    intermediate: { title: string; description: string; skills_used: string[] }[];
    advanced: { title: string; description: string; skills_used: string[] }[];
  };
  interview_preparation: {
    important_topics: string[];
    practice_strategy: string;
    mock_interview_platforms: { name: string; url: string }[];
  };
  job_preparation: {
    portfolio_tips: string[];
    github_tips: string[];
    resume_tips: string[];
    application_strategy: string;
  };
  career_outcome: {
    what_you_can_build: string[];
    what_you_can_apply_for: string[];
    interview_readiness: string;
  };
  skills_to_learn: string[];
  resources: Resource[];
  real_world_practice: {
    open_source_suggestion: string;
    portfolio_requirement: string;
    github_requirement: string;
    resume_readiness: string;
  };
  final_career_outcome: {
    can_build: string[];
    can_apply_for: string[];
    interview_level: string;
  };
  deployment_job_phase: {
    how_to_deploy: string;
    resume_tips: string[];
    job_application_strategy: string;
  };
}

// ============================================
// GROQ LLM CALL
// ============================================
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
      max_tokens: 8000,
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

// ============================================
// MAIN HANDLER
// ============================================
Deno.serve(async (req: any) => {
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

    // Calculate duration based on time commitment
    const commitment = timeCommitment || "part_time";
    const isFullTime = commitment === "full_time" || commitment === "Full-time (40 hrs/week)";
    const isIntensive = commitment === "intensive" || commitment === "Intensive (60+ hrs/week)";
    const totalWeeks = isIntensive ? 12 : isFullTime ? 16 : 24;
    const basePhaseDuration = Math.round(totalWeeks / 4);

    // Create comprehensive AI prompt for role-specific roadmap
    const prompt = `You are an expert career mentor. Create a detailed, practical learning roadmap for becoming a ${targetRole}.

IMPORTANT: Generate content SPECIFIC to ${targetRole}. Do NOT use generic web development skills unless they are directly relevant to this role.

Current level: ${currentLevel || "Beginner"}
Experience: ${experienceLevel || "Fresher"}
Time commitment: ${commitment}
Total duration: ${totalWeeks} weeks

Return ONLY valid JSON (no markdown, no explanations) with this EXACT structure:

{
  "career_overview": {
    "what_this_role_does": "Clear 2-3 sentence explanation of what a ${targetRole} actually does day-to-day",
    "where_this_role_is_used": "Industries and companies where this role is needed",
    "companies_that_hire": ["Specific company names or types that hire this role"]
  },
  "skills_required": {
    "core_technical": ["List 5-7 SPECIFIC technical skills for ${targetRole} - e.g., for RPA: UiPath, Automation Anywhere, Blue Prism, not HTML/CSS"],
    "tools_and_technologies": ["List 4-6 SPECIFIC tools used by ${targetRole}"],
    "conceptual_knowledge": ["List 3-5 key concepts a ${targetRole} must understand"]
  },
  "milestones": [
    {
      "id": "m1",
      "title": "Foundation Building",
      "phase": "Phase 1 - Weeks 1-${basePhaseDuration}",
      "duration": "${basePhaseDuration} weeks",
      "status": "pending",
      "goal": "Clear goal for this phase specific to ${targetRole}",
      "what_to_learn": ["Specific topics to learn for ${targetRole} in this phase"],
      "where_to_learn": [
        {"title": "Resource name", "url": "https://...", "type": "course/tutorial/documentation", "is_free": true/false}
      ],
      "practice_tasks": ["Specific hands-on tasks for ${targetRole}"],
      "mini_project": {
        "title": "Project name relevant to ${targetRole}",
        "description": "What to build",
        "technologies": ["Specific tools for this project"]
      },
      "skills_gained": ["What skills you will have after this phase"],
      "tasks": [
        {"id": "t1_1", "title": "Specific actionable task", "completed": false}
      ]
    }
    // Create 4 milestones total with similar structure
  ],
  "practice_platforms": [
    {"name": "Platform name relevant to ${targetRole}", "url": "https://...", "how_it_helps": "How it helps learning"}
  ],
  "project_ideas": {
    "beginner": [
      {"title": "Beginner project for ${targetRole}", "description": "Description", "skills_used": ["skill1", "skill2"]}
    ],
    "intermediate": [
      {"title": "Intermediate project for ${targetRole}", "description": "Description", "skills_used": ["skill1", "skill2"]}
    ],
    "advanced": [
      {"title": "Advanced project for ${targetRole}", "description": "Description", "skills_used": ["skill1", "skill2"]}
    ]
  },
  "interview_preparation": {
    "important_topics": ["Topics specific to ${targetRole} interviews"],
    "practice_strategy": "How to prepare for ${targetRole} interviews",
    "mock_interview_platforms": [
      {"name": "Platform", "url": "https://..."}
    ]
  },
  "job_preparation": {
    "portfolio_tips": ["Tips for ${targetRole} portfolio"],
    "github_tips": ["GitHub tips for ${targetRole}"],
    "resume_tips": ["Resume tips for ${targetRole}"],
    "application_strategy": "Strategy for applying to ${targetRole} jobs"
  },
  "career_outcome": {
    "what_you_can_build": ["Things you can build as ${targetRole}"],
    "what_you_can_apply_for": ["Job titles you can apply for"],
    "interview_readiness": "Your interview readiness level"
  }
}

CRITICAL RULES:
1. Make EVERYTHING specific to ${targetRole}
2. For RPA Developer: Use UiPath, Automation Anywhere, Blue Prism, Power Automate, Python scripting
3. For Machine Learning: Use Python, TensorFlow, PyTorch, Scikit-learn, Jupyter, Data preprocessing
4. For DevOps: Use Docker, Kubernetes, Jenkins, Terraform, AWS/Azure/GCP
5. For Mobile: Use React Native/Flutter/Swift/Kotlin
6. Include REAL resource URLs when possible (official documentation, known courses)
7. Create 4 milestones with ${basePhaseDuration} weeks each
8. Each milestone should have 3-4 tasks
9. Use simple, practical language that students understand

Return ONLY the JSON, no other text.`;

    // Call AI to generate dynamic roadmap
    let roadmap: RoadmapData;
    
    try {
      const aiContent = await callGroqLLM(GROQ_API_KEY, prompt);
      const aiRoadmap = JSON.parse(aiContent);
      
      // Build complete roadmap from AI response
      roadmap = {
        target_role: targetRole,
        current_level: currentLevel || "Beginner",
        experience_level: experienceLevel || "Fresher",
        time_commitment: timeCommitment || "Part-time (10 hrs/week)",
        total_duration: `${totalWeeks} weeks`,
        
        career_overview: aiRoadmap.career_overview || {
          what_this_role_does: `${targetRole} works on building and maintaining software solutions.`,
          where_this_role_is_used: "Technology companies and enterprises",
          companies_that_hire: ["Tech companies", "Startups", "Enterprises"]
        },
        
        skills_required: aiRoadmap.skills_required || {
          core_technical: [],
          tools_and_technologies: [],
          conceptual_knowledge: []
        },
        
        milestones: (aiRoadmap.milestones || []).map((m: any, idx: number) => ({
          id: m.id || `m${idx + 1}`,
          title: m.title || `Milestone ${idx + 1}`,
          phase: m.phase || `Phase ${idx + 1}`,
          duration: m.duration || `${basePhaseDuration} weeks`,
          status: m.status || "pending",
          goal: m.goal || "",
          what_to_learn: m.what_to_learn || [],
          where_to_learn: m.where_to_learn || [],
          practice_tasks: m.practice_tasks || [],
          mini_project: m.mini_project || { title: "", description: "", technologies: [] },
          skills_gained: m.skills_gained || [],
          tasks: (m.tasks || []).map((t: any, tIdx: number) => ({
            id: t.id || `t${idx + 1}_${tIdx + 1}`,
            title: t.title || `Task ${tIdx + 1}`,
            completed: false
          }))
        })),
        
        weekly_plan: [],
        practice_platforms: aiRoadmap.practice_platforms || [],
        project_ideas: aiRoadmap.project_ideas || { beginner: [], intermediate: [], advanced: [] },
        interview_preparation: aiRoadmap.interview_preparation || { important_topics: [], practice_strategy: "", mock_interview_platforms: [] },
        job_preparation: aiRoadmap.job_preparation || { portfolio_tips: [], github_tips: [], resume_tips: [], application_strategy: "" },
        career_outcome: aiRoadmap.career_outcome || { what_you_can_build: [], what_you_can_apply_for: [], interview_readiness: "" },
        
        // Legacy fields for UI compatibility
        skills_to_learn: [...(aiRoadmap.skills_required?.core_technical || []), ...(aiRoadmap.skills_required?.tools_and_technologies || [])],
        resources: (aiRoadmap.milestones || []).flatMap((m: any) => m.where_to_learn || []),
        real_world_practice: {
          open_source_suggestion: aiRoadmap.job_preparation?.github_tips?.[0] || "Contribute to open source projects",
          portfolio_requirement: aiRoadmap.job_preparation?.portfolio_tips?.[0] || "Build a strong portfolio",
          github_requirement: "Maintain active GitHub profile",
          resume_readiness: aiRoadmap.job_preparation?.resume_tips?.[0] || "Tailor resume for each job"
        },
        final_career_outcome: {
          can_build: aiRoadmap.career_outcome?.what_you_can_build || [],
          can_apply_for: aiRoadmap.career_outcome?.what_you_can_apply_for || [],
          interview_level: aiRoadmap.career_outcome?.interview_readiness || "Fresher to Mid-level"
        },
        deployment_job_phase: {
          how_to_deploy: "Deploy your projects on cloud platforms",
          resume_tips: aiRoadmap.job_preparation?.resume_tips || [],
          job_application_strategy: aiRoadmap.job_preparation?.application_strategy || ""
        }
      };
      
      console.log("Successfully generated AI roadmap for:", targetRole);
      
    } catch (aiError) {
      console.error("AI generation failed:", aiError);
      
      // Fallback: Create role-specific roadmap based on role type
      const roleLower = targetRole.toLowerCase();
      
      // Role-specific skill configurations
      let coreSkills: string[] = [];
      let tools: string[] = [];
      let concepts: string[] = [];
      let resources: Resource[] = [];
      
      if (roleLower.includes("rpa") || roleLower.includes("automation")) {
        coreSkills = ["UiPath", "Automation Anywhere", "Blue Prism", "Power Automate", "Python Scripting", "Process Mining"];
        tools = ["UiPath Studio", "Orchestrator", "Power Platform", "Git", "SQL Server"];
        concepts = ["Workflow Design", "Bot Development", "Exception Handling", "Selectors", "REFramework"];
        resources = [
          { title: "UiPath Academy", url: "https://academy.uipath.com", type: "course", is_free: true },
          { title: "Automation Anywhere University", url: "https://university.automationanywhere.com", type: "course", is_free: true },
          { title: "Microsoft Learn - Power Automate", url: "https://learn.microsoft.com/power-automate", type: "documentation", is_free: true }
        ];
      } else if (roleLower.includes("machine learning") || roleLower.includes("ml") || roleLower.includes("data scientist")) {
        coreSkills = ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Deep Learning", "NLP", "Computer Vision"];
        tools = ["Jupyter Notebook", "Pandas", "NumPy", "Matplotlib", "Google Colab", "Kaggle"];
        concepts = ["Neural Networks", "Feature Engineering", "Model Training", "Hyperparameter Tuning", "Cross-validation"];
        resources = [
          { title: "Coursera Machine Learning", url: "https://coursera.org/learn/machine-learning", type: "course", is_free: false },
          { title: "Fast.ai", url: "https://course.fast.ai", type: "course", is_free: true },
          { title: "Kaggle Learn", url: "https://kaggle.com/learn", type: "platform", is_free: true }
        ];
      } else if (roleLower.includes("devops") || roleLower.includes("sre")) {
        coreSkills = ["Docker", "Kubernetes", "CI/CD", "Terraform", "Ansible", "Monitoring", "Cloud Services"];
        tools = ["Jenkins", "GitHub Actions", "Prometheus", "Grafana", "AWS/Azure/GCP", "Docker Compose"];
        concepts = ["Containerization", "Infrastructure as Code", "High Availability", "Auto-scaling", "Security"];
        resources = [
          { title: "Docker Docs", url: "https://docs.docker.com", type: "documentation", is_free: true },
          { title: "Kubernetes.io", url: "https://kubernetes.io/docs", type: "documentation", is_free: true },
          { title: "AWS Training", url: "https://aws.amazon.com/training", type: "course", is_free: true }
        ];
      } else if (roleLower.includes("frontend") || roleLower.includes("react")) {
        coreSkills = ["HTML", "CSS", "JavaScript", "TypeScript", "React", "State Management", "Responsive Design"];
        tools = ["VS Code", "Git", "Webpack/Vite", "Chrome DevTools", "Figma"];
        concepts = ["DOM Manipulation", "Component Architecture", "REST APIs", "Authentication", "Performance"];
        resources = [
          { title: "FreeCodeCamp", url: "https://freecodecamp.org", type: "course", is_free: true },
          { title: "React Docs", url: "https://react.dev", type: "documentation", is_free: true },
          { title: "Frontend Masters", url: "https://frontendmasters.com", type: "course", is_free: false }
        ];
      } else if (roleLower.includes("backend") || roleLower.includes("node") || roleLower.includes("python")) {
        coreSkills = ["Python/Java/Node.js", "REST APIs", "Database Design", "Authentication", "Server Architecture", "Microservices"];
        tools = ["Postman", "Docker", "Git", "PostgreSQL", "MongoDB", "Redis"];
        concepts = ["API Design", "Data Modeling", "Caching", "Security", "Load Balancing"];
        resources = [
          { title: "Node.js Docs", url: "https://nodejs.org/docs", type: "documentation", is_free: true },
          { title: "Django/Flask Tutorial", url: "https://docs.djangoproject.com", type: "documentation", is_free: true },
          { title: "PostgreSQL Tutorial", url: "https://postgresqltutorial.com", type: "tutorial", is_free: true }
        ];
      } else {
        // Default software developer
        coreSkills = ["Programming Fundamentals", "Data Structures", "Algorithms", "Version Control", "Testing", "Debugging"];
        tools = ["Git", "VS Code", "Docker", "CI/CD Tools", "Database Tools"];
        concepts = ["Software Design", "Clean Code", "Testing", "Code Review", "Documentation"];
        resources = [
          { title: "FreeCodeCamp", url: "https://freecodecamp.org", type: "course", is_free: true },
          { title: "GitHub Learning Lab", url: "https://lab.github.com", type: "course", is_free: true }
        ];
      }
      
      // Build fallback roadmap
      roadmap = {
        target_role: targetRole,
        current_level: currentLevel || "Beginner",
        experience_level: experienceLevel || "Fresher",
        time_commitment: timeCommitment || "Part-time (10 hrs/week)",
        total_duration: `${totalWeeks} weeks`,
        
        career_overview: {
          what_this_role_does: `A ${targetRole} specializes in building and maintaining solutions using ${coreSkills.slice(0, 3).join(", ")}.`,
          where_this_role_is_used: `${targetRole}s work in technology companies, enterprises, consulting firms, and any organization that needs these skills.`,
          companies_that_hire: ["Tech companies", "Startups", "Consulting firms", "Enterprises", "Banks", "Healthcare"]
        },
        
        skills_required: {
          core_technical: coreSkills,
          tools_and_technologies: tools,
          conceptual_knowledge: concepts
        },
        
        milestones: [
          {
            id: "m1",
            title: "Foundation Building",
            phase: `Phase 1 - Weeks 1-${basePhaseDuration}`,
            duration: `${basePhaseDuration} weeks`,
            status: "pending",
            goal: `Learn the fundamentals of ${targetRole} and set up your development environment`,
            what_to_learn: coreSkills.slice(0, 3).map(s => `${s} fundamentals`),
            where_to_learn: resources.slice(0, 2),
            practice_tasks: [`Set up ${tools[0]}`, "Complete basic tutorials", "Build first small project"],
            mini_project: {
              title: `Basic ${targetRole} Project`,
              description: `Create a simple project to practice ${coreSkills[0]} and ${coreSkills[1]}`,
              technologies: coreSkills.slice(0, 2)
            },
            skills_gained: [`Basic ${coreSkills[0]}`, `Understanding of ${concepts[0]}`],
            tasks: [
              { id: "t1_1", title: `Complete ${coreSkills[0]} basics course`, completed: false },
              { id: "t1_2", title: `Set up ${tools[0]} environment`, completed: false },
              { id: "t1_3", title: "Build foundation project", completed: false }
            ]
          },
          {
            id: "m2",
            title: "Core Skills Development",
            phase: `Phase 2 - Weeks ${basePhaseDuration + 1}-${basePhaseDuration * 2}`,
            duration: `${basePhaseDuration} weeks`,
            status: "pending",
            goal: `Master the main tools and technologies used by ${targetRole}s`,
            what_to_learn: coreSkills.slice(3, 5).map(s => `Advanced ${s}`),
            where_to_learn: resources,
            practice_tasks: [`Build projects using ${coreSkills[3]}`, "Practice real-world scenarios", "Debug and troubleshoot"],
            mini_project: {
              title: "Intermediate Project",
              description: "Build a more complex project combining multiple skills",
              technologies: coreSkills.slice(2, 5)
            },
            skills_gained: [`Proficiency in ${coreSkills[3]}`, `Understanding of ${concepts[1]}`],
            tasks: [
              { id: "t2_1", title: `Master ${coreSkills[3]}`, completed: false },
              { id: "t2_2", title: `Learn ${coreSkills[4]}`, completed: false },
              { id: "t2_3", title: "Build intermediate project", completed: false }
            ]
          },
          {
            id: "m3",
            title: "Advanced Topics",
            phase: `Phase 3 - Weeks ${basePhaseDuration * 2 + 1}-${basePhaseDuration * 3}`,
            duration: `${basePhaseDuration} weeks`,
            status: "pending",
            goal: "Learn advanced concepts and build portfolio-worthy projects",
            what_to_learn: concepts.slice(0, 3),
            where_to_learn: resources,
            practice_tasks: ["Build portfolio project", "Learn best practices", "Contribute to open source"],
            mini_project: {
              title: "Portfolio Project",
              description: "Build a complete, production-ready project",
              technologies: coreSkills.slice(0, 5)
            },
            skills_gained: ["Can build complete solutions", "Understand best practices"],
            tasks: [
              { id: "t3_1", title: "Learn advanced concepts", completed: false },
              { id: "t3_2", title: "Build portfolio project", completed: false },
              { id: "t3_3", title: "Deploy project online", completed: false }
            ]
          },
          {
            id: "m4",
            title: "Interview Preparation",
            phase: `Phase 4 - Weeks ${basePhaseDuration * 3 + 1}-${totalWeeks}`,
            duration: `${basePhaseDuration} weeks`,
            status: "pending",
            goal: "Prepare for technical interviews and job applications",
            what_to_learn: ["Problem Solving", "System Design", "Behavioral Questions", "Mock Interviews"],
            where_to_learn: [
              { title: "LeetCode", url: "https://leetcode.com", type: "platform", is_free: true },
              { title: "Pramp", url: "https://pramp.com", type: "platform", is_free: true }
            ],
            practice_tasks: ["Solve coding problems", "Practice mock interviews", "Prepare resume"],
            mini_project: {
              title: "Interview Prep",
              description: "Complete interview preparation",
              technologies: ["Problem Solving", "Communication"]
            },
            skills_gained: ["Ready for interviews", "Strong portfolio"],
            tasks: [
              { id: "t4_1", title: "Solve 50+ practice problems", completed: false },
              { id: "t4_2", title: "Complete mock interviews", completed: false },
              { id: "t4_3", title: "Prepare resume and portfolio", completed: false }
            ]
          }
        ],
        
        weekly_plan: [],
        practice_platforms: [
          { name: "LeetCode", url: "https://leetcode.com", how_it_helps: "Practice coding problems" },
          { name: "HackerRank", url: "https://hackerrank.com", how_it_helps: "Solve challenges and earn certificates" },
          { name: "GitHub", url: "https://github.com", how_it_helps: "Build portfolio and contribute to open source" }
        ],
        project_ideas: {
          beginner: [{ title: `Basic ${targetRole} Project`, description: "Simple starter project", skills_used: coreSkills.slice(0, 2) }],
          intermediate: [{ title: `${targetRole} Application`, description: "Full-featured application", skills_used: coreSkills.slice(0, 4) }],
          advanced: [{ title: `Enterprise ${targetRole} Solution`, description: "Production-ready system", skills_used: coreSkills }]
        },
        interview_preparation: {
          important_topics: concepts,
          practice_strategy: "Practice daily, focus on fundamentals, explain your solutions out loud",
          mock_interview_platforms: [{ name: "Pramp", url: "https://pramp.com" }, { name: "Interviewing.io", url: "https://interviewing.io" }]
        },
        job_preparation: {
          portfolio_tips: ["Include 3-4 strong projects", "Show your best work first"],
          github_tips: ["Keep profile active", "Write good READMEs"],
          resume_tips: ["Quantify achievements", "Use action verbs"],
          application_strategy: "Apply to 5-10 jobs per week, network on LinkedIn"
        },
        career_outcome: {
          what_you_can_build: [`Complete ${targetRole} solutions`, "Portfolio projects", "Production applications"],
          what_you_can_apply_for: [`Junior ${targetRole}`, `Associate ${targetRole}`, `${targetRole} Intern`],
          interview_readiness: "Ready for fresher to mid-level interviews"
        },
        
        // Legacy fields
        skills_to_learn: [...coreSkills, ...tools],
        resources: resources,
        real_world_practice: {
          open_source_suggestion: "Contribute to open source projects on GitHub",
          portfolio_requirement: "Build 3-4 complete projects",
          github_requirement: "Maintain active GitHub profile",
          resume_readiness: "Tailor resume for each job"
        },
        final_career_outcome: {
          can_build: [`Complete ${targetRole} solutions`, "Portfolio projects"],
          can_apply_for: [`Junior ${targetRole}`, `Associate ${targetRole}`],
          interview_level: "Fresher to Mid-level"
        },
        deployment_job_phase: {
          how_to_deploy: "Use cloud platforms like Vercel, Netlify, or Heroku",
          resume_tips: ["Quantify achievements", "Use action verbs", "Include keywords"],
          job_application_strategy: "Apply to 10 jobs per week, network on LinkedIn"
        }
      };
    }

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
