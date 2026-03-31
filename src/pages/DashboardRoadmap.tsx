import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Map, Target, Clock, Sparkles, Loader2, CheckCircle, 
  Circle, ArrowRight, BookOpen, Code, Briefcase, Users,
  Trophy, Star, ChevronRight, ChevronDown, ChevronUp, 
  Rocket, FileText, Github, Globe, Award, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SkillToLearn {
  skill: string;
  explanation: string;
  category?: string;
}

interface WeeklyTask {
  week: number;
  tasks: string[];
  focus: string;
}

interface MiniProject {
  title: string;
  description: string;
  technologies: string[];
  skills_learned: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface Resource {
  title: string;
  url: string;
  type: string;
  is_free?: boolean;
  category?: "free" | "paid" | "community";
}

interface Milestone {
  id: string;
  title: string;
  phase?: string;
  description?: string;
  duration: string;
  status: "completed" | "in_progress" | "pending";
  goal?: string;
  skills_to_learn?: SkillToLearn[];
  what_you_can_do?: string[];
  mini_project?: MiniProject;
  deliverable?: string;
  how_to_know_ready?: string;
  resources?: Resource[];
  important_tip?: string;
  weekly_tasks?: WeeklyTask[];
  milestone_outcome?: string;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

interface RoleOverview {
  what_this_role_does: string;
  why_important: string;
  typical_responsibilities: string[];
  companies_that_hire: string[];
}

interface FinalCareerOutcome {
  can_build: string[];
  can_apply_for: string[];
  interview_level: string;
  what_you_will_achieve: string;
}

interface RealWorldPractice {
  open_source_suggestion: string;
  portfolio_requirement: string;
  github_requirement: string;
  resume_readiness: string;
}

interface DSAPractice {
  platforms: string[];
  topics_to_focus: string[];
  problems_to_solve: number;
}

interface SystemDesignBasics {
  needed: boolean;
  topics: string[];
}

interface MockInterview {
  platforms: string[];
  frequency: string;
}

interface InterviewPreparation {
  dsa_practice: DSAPractice;
  system_design_basics: SystemDesignBasics;
  mock_interview: MockInterview;
  coding_platforms: string[];
  recommended_problems: number;
}

interface DeploymentJobPhase {
  how_to_deploy: string;
  deployment_platforms: string[];
  cloud_platforms: string[];
  cicd_tools: string[];
  resume_tips: string[];
  job_application_strategy: string;
}

interface SkillCategory {
  category_name: string;
  skills: string[];
  icon: string;
}

interface SkillProgressTracker {
  categories: {
    name: string;
    percentage: number;
    skills: string[];
  }[];
}

interface ProjectRoadmap {
  beginner: MiniProject[];
  intermediate: MiniProject[];
  advanced: MiniProject[];
}

interface LearningResources {
  free: Resource[];
  paid: Resource[];
  communities: Resource[];
}

interface PortfolioRequirements {
  minimum_projects: number;
  required_elements: string[];
  github_expectations: string[];
  documentation_tips: string[];
}

interface RoadmapData {
  target_role: string;
  current_level: string;
  experience_level: string;
  time_commitment?: string;
  total_duration: string;
  total_weeks: number;
  
  // Section 1: Role Overview
  role_overview?: RoleOverview;
  
  // Section 2: Skills to Develop
  skills_by_category?: SkillCategory[];
  skills_to_learn: string[];
  
  // Section 3: Horizontal Learning Roadmap
  milestones: Milestone[];
  
  // Section 4: Project Roadmap
  project_roadmap?: ProjectRoadmap;
  
  // Section 5: Interview Preparation
  interview_preparation?: InterviewPreparation;
  
  // Section 6: Deployment & Industry Practices
  deployment_job_phase?: DeploymentJobPhase;
  
  // Section 7: Portfolio Requirements
  portfolio_requirements?: PortfolioRequirements;
  
  // Section 8: Learning Resources
  learning_resources?: LearningResources;
  resources: {
    title: string;
    url: string;
    type: "course" | "book" | "project" | "certification";
  }[];
  
  // Section 9: Skill Progress Tracker
  skill_progress_tracker?: SkillProgressTracker;
  
  // Section 10: Final Career Outcome
  final_career_outcome?: FinalCareerOutcome;
  real_world_practice?: RealWorldPractice;
}

const DashboardRoadmap = () => {
  const [formData, setFormData] = useState({
    targetRole: "",
    currentLevel: "",
    experienceLevel: "",
    timeCommitment: "part_time",
  });
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [existingRoadmaps, setExistingRoadmaps] = useState<any[]>([]);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  const generateDynamicRoadmap = (targetRole: string, currentLevel: string, experienceLevel: string, timeCommitment: string): RoadmapData => {
    const roleLower = targetRole.toLowerCase();
    const totalWeeks = timeCommitment === "full_time" ? 16 : 24;
    const basePhaseDuration = Math.round(totalWeeks / 4);
    
    // Role-specific configurations
    let coreSkills: string[] = [];
    let tools: string[] = [];
    let concepts: string[] = [];
    let roleOverview: RoleOverview = {
      what_this_role_does: `${targetRole} works on building and maintaining solutions in their field.`,
      companies_that_hire: ["Companies in this industry", "Startups", "Enterprises"]
    };
    let resources: Resource[] = [];
    
    // Interview prep - role specific
    let interviewPrep: any = {
      platforms: [],
      topics: [],
      practice_type: "general"
    };
    
    // Practice platforms - role specific
    let practicePlatforms: string[] = [];
    
    // ============================================
    // RPA / AUTOMATION (Non-coding focus)
    // ============================================
    if (roleLower.includes("rpa") || roleLower.includes("automation") || roleLower.includes("robotic process")) {
      coreSkills = ["UiPath Studio", "Power Automate", "Automation Anywhere", "Blue Prism", "Process Mapping", "Bot Development"];
      tools = ["UiPath Orchestrator", "Power Platform", "Excel", "SQL Server", "Git"];
      concepts = ["Workflow Design", "Process Mining", "Exception Handling", "Selectors & Scraping", "REFramework"];
      roleOverview = {
        what_this_role_does: "RPA Developers build software robots that automate repetitive business tasks like data entry, form filling, and report generation. They help companies save time and reduce errors.",
        why_important: "RPA is crucial for businesses to reduce manual work, cut costs, improve accuracy, and free employees to focus on creative tasks. Companies worldwide are adopting RPA to stay competitive.",
        typical_responsibilities: ["Analyze business processes for automation opportunities", "Design and build automation workflows", "Test and debug bots", "Monitor and maintain deployed automations", "Document processes and solutions", "Collaborate with business teams to understand requirements"],
        companies_that_hire: ["UiPath", "Automation Anywhere", "Accenture", "Deloitte", "PwC", "Banks", "Insurance companies", "Healthcare"]
      };
      resources = [
        { title: "UiPath Academy (Free)", url: "https://academy.uipath.com", type: "course", is_free: true },
        { title: "Microsoft Power Automate Learn", url: "https://learn.microsoft.com/power-automate", type: "course", is_free: true },
        { title: "Automation Anywhere University", url: "https://university.automationanywhere.com", type: "course", is_free: true }
      ];
      interviewPrep = {
        platforms: ["UiPath Forum", "RPA Forums", "LinkedIn RPA Groups"],
        topics: ["Process Analysis", "Bot Architecture", "Error Handling Scenarios", "Real-world Automation Cases"],
        practice_type: "Build automation projects and get certified"
      };
      practicePlatforms = ["UiPath Academy Certification", "Power Platform Fundamentals", "RPA Challenge"];
    }
    
    // ============================================
    // HYPERSPECTRAL / REMOTE SENSING / GIS
    // ============================================
    else if (roleLower.includes("hyperspectral") || roleLower.includes("remote sensing") || roleLower.includes("gis") || roleLower.includes("geospatial") || roleLower.includes("satellite") || roleLower.includes("spectral")) {
      coreSkills = ["Remote Sensing", "Image Processing", "Spectral Analysis", "GIS Mapping", "Python for Geospatial", "Satellite Data Processing"];
      tools = ["ENVI", "ArcGIS", "QGIS", "Google Earth Engine", "Python (Rasterio, GDAL)", "SNAP Toolbox"];
      concepts = ["Electromagnetic Spectrum", "Spectral Signatures", "Image Classification", "Atmospheric Correction", "Data Fusion"];
      roleOverview = {
        what_this_role_does: "Hyperspectral/Remote Sensing analysts work with satellite and aerial imagery to identify materials, monitor environment, analyze crops, detect minerals, and support research using spectral data.",
        why_important: "Remote sensing is essential for climate monitoring, agriculture, disaster response, mineral exploration, and urban planning. It helps us understand Earth's changes and make data-driven decisions for sustainability.",
        typical_responsibilities: ["Process and analyze satellite/aerial imagery", "Perform spectral analysis to identify materials", "Create maps and visualizations from geospatial data", "Develop algorithms for image classification", "Collaborate with researchers on environmental studies", "Write reports and present findings to stakeholders"],
        companies_that_hire: ["NASA", "ESA", "ISRO", "SpaceX", "Planet Labs", "Agriculture companies", "Mining companies", "Environmental agencies", "Research labs"]
      };
      resources = [
        { title: "NASA ARSET Training", url: "https://appliedsciences.nasa.gov/arset", type: "course", is_free: true },
        { title: "Google Earth Engine Tutorials", url: "https://developers.google.com/earth-engine/tutorials", type: "tutorial", is_free: true },
        { title: "QGIS Training Manual", url: "https://docs.qgis.org", type: "documentation", is_free: true }
      ];
      interviewPrep = {
        platforms: ["GIS Stack Exchange", "Earth Engine Forum", "Remote Sensing journals"],
        topics: ["Spectral Band Selection", "Classification Algorithms", "Image Pre-processing", "Application Case Studies"],
        practice_type: "Work on real satellite datasets and publish analysis"
      };
      practicePlatforms = ["Kaggle Satellite Competitions", "Google Earth Engine", "Copernicus Open Data"];
    }
    
    // ============================================
    // MACHINE LEARNING / AI / DEEP LEARNING
    // ============================================
    else if (roleLower.includes("machine learning") || roleLower.includes("deep learning") || roleLower.includes("ml engineer") || roleLower.includes("ai engineer") || roleLower.includes("nlp") || roleLower.includes("computer vision")) {
      coreSkills = ["Python", "TensorFlow/PyTorch", "Machine Learning Algorithms", "Deep Learning", "Model Training", "Feature Engineering"];
      tools = ["Jupyter Notebook", "Pandas", "NumPy", "Scikit-learn", "Google Colab", "MLflow"];
      concepts = ["Neural Networks", "CNN/RNN/Transformers", "Model Evaluation", "Hyperparameter Tuning", "MLOps"];
      roleOverview = {
        what_this_role_does: "ML Engineers build AI systems that learn from data. They train models for predictions, recommendations, image recognition, chatbots, and many other applications.",
        why_important: "Machine Learning powers the intelligent features in products we use daily - from recommendations to voice assistants. Companies need ML engineers to build competitive AI-powered products.",
        typical_responsibilities: ["Design and train machine learning models", "Preprocess and analyze large datasets", "Optimize models for performance and accuracy", "Deploy models to production systems", "Monitor model performance and retrain as needed", "Research and implement new ML techniques"],
        companies_that_hire: ["Google", "Meta", "Amazon", "Microsoft", "OpenAI", "NVIDIA", "Startups", "Healthcare AI", "FinTech"]
      };
      resources = [
        { title: "Andrew Ng ML Course (Coursera)", url: "https://coursera.org/learn/machine-learning", type: "course", is_free: false },
        { title: "Fast.ai (Free)", url: "https://course.fast.ai", type: "course", is_free: true },
        { title: "Kaggle Learn", url: "https://kaggle.com/learn", type: "platform", is_free: true }
      ];
      interviewPrep = {
        platforms: ["Kaggle Competitions", "LeetCode ML Problems", "InterviewBit ML"],
        topics: ["ML Algorithms", "System Design for ML", "Feature Engineering", "Model Debugging"],
        practice_type: "Build ML projects and participate in competitions"
      };
      practicePlatforms = ["Kaggle", "DrivenData", "Google Colab"];
    }
    
    // ============================================
    // DATA SCIENTIST (Analytics focused)
    // ============================================
    else if (roleLower.includes("data scientist") || roleLower.includes("data science")) {
      coreSkills = ["Python/R", "Statistics", "Machine Learning", "Data Visualization", "SQL", "Experiment Design"];
      tools = ["Jupyter", "Pandas", "Tableau", "Power BI", "Spark", "Excel"];
      concepts = ["Statistical Analysis", "A/B Testing", "Feature Engineering", "Storytelling with Data", "Business Analytics"];
      roleOverview = {
        what_this_role_does: "Data Scientists analyze data to find insights, build prediction models, and help businesses make better decisions using statistics and machine learning.",
        why_important: "Data-driven decisions give companies a competitive edge. Data Scientists uncover hidden patterns and insights that drive strategy, product improvements, and revenue growth.",
        typical_responsibilities: ["Analyze large datasets to find patterns", "Build predictive models and algorithms", "Create visualizations and dashboards", "Design and analyze A/B tests", "Communicate findings to stakeholders", "Collaborate with teams to implement data solutions"],
        companies_that_hire: ["All tech companies", "Banks", "E-commerce", "Healthcare", "Consulting firms", "Startups"]
      };
      resources = [
        { title: "DataCamp", url: "https://datacamp.com", type: "platform", is_free: false },
        { title: "Google Data Analytics Certificate", url: "https://coursera.org/professional-certificates/google-data-analytics", type: "course", is_free: false },
        { title: "Kaggle Learn", url: "https://kaggle.com/learn", type: "platform", is_free: true }
      ];
      interviewPrep = {
        platforms: ["Kaggle", "DataCamp Projects", "StrataScratch"],
        topics: ["Statistics", "SQL Queries", "Case Studies", "Business Problems"],
        practice_type: "Complete data analysis projects end-to-end"
      };
      practicePlatforms = ["Kaggle", "StrataScratch", "DataCamp Projects"];
    }
    
    // ============================================
    // DEVOPS / CLOUD / SRE
    // ============================================
    else if (roleLower.includes("devops") || roleLower.includes("sre") || roleLower.includes("cloud engineer") || roleLower.includes("platform engineer")) {
      coreSkills = ["Docker", "Kubernetes", "CI/CD Pipelines", "Cloud Platforms (AWS/Azure/GCP)", "Infrastructure as Code", "Monitoring"];
      tools = ["Jenkins", "GitHub Actions", "Terraform", "Ansible", "Prometheus", "Grafana"];
      concepts = ["Container Orchestration", "High Availability", "Auto-scaling", "Security", "Cost Optimization"];
      roleOverview = {
        what_this_role_does: "DevOps Engineers automate software deployment, manage cloud infrastructure, and ensure systems run reliably. They bridge development and operations teams.",
        why_important: "DevOps enables faster, safer software delivery. Companies need DevOps to release features quickly, maintain uptime, and scale infrastructure efficiently.",
        typical_responsibilities: ["Set up and manage CI/CD pipelines", "Configure and monitor cloud infrastructure", "Automate deployment processes", "Troubleshoot production issues", "Implement security best practices", "Collaborate with development and operations teams"],
        companies_that_hire: ["Amazon", "Google", "Netflix", "Spotify", "Uber", "All tech companies", "Enterprises"]
      };
      resources = [
        { title: "Docker Docs", url: "https://docs.docker.com", type: "documentation", is_free: true },
        { title: "Kubernetes.io", url: "https://kubernetes.io/docs", type: "documentation", is_free: true },
        { title: "AWS Free Tier Training", url: "https://aws.amazon.com/training", type: "course", is_free: true }
      ];
      interviewPrep = {
        platforms: ["DevOps Subreddit", "Medium DevOps Blogs", "Kubernetes Forums"],
        topics: ["CI/CD Design", "Troubleshooting Scenarios", "Cloud Architecture", "Security Best Practices"],
        practice_type: "Build and deploy real projects on cloud"
      };
      practicePlatforms = ["AWS Free Tier", "Google Cloud Free Tier", "Docker Hub", "GitHub Actions"];
    }
    
    // ============================================
    // FRONTEND / WEB DEVELOPMENT
    // ============================================
    else if (roleLower.includes("frontend") || roleLower.includes("react") || roleLower.includes("vue") || roleLower.includes("angular") || roleLower.includes("web developer")) {
      coreSkills = ["HTML", "CSS", "JavaScript", "React/Vue/Angular", "TypeScript", "Responsive Design"];
      tools = ["VS Code", "Git", "Chrome DevTools", "Figma", "Webpack/Vite"];
      concepts = ["DOM Manipulation", "State Management", "API Integration", "Accessibility", "Performance"];
      roleOverview = {
        what_this_role_does: "Frontend Developers create the visual parts of websites and apps that users interact with. They make sure interfaces look good and work smoothly.",
        why_important: "Users judge products by their interfaces. Good frontend development creates positive user experiences, increases engagement, and drives business success.",
        typical_responsibilities: ["Build responsive user interfaces", "Implement designs from mockups", "Optimize performance and accessibility", "Integrate with backend APIs", "Fix bugs and improve user experience", "Collaborate with designers and backend developers"],
        companies_that_hire: ["All tech companies", "Startups", "Digital agencies", "E-commerce", "Media companies"]
      };
      resources = [
        { title: "FreeCodeCamp (Free)", url: "https://freecodecamp.org", type: "course", is_free: true },
        { title: "React Official Docs", url: "https://react.dev", type: "documentation", is_free: true },
        { title: "Frontend Masters", url: "https://frontendmasters.com", type: "course", is_free: false }
      ];
      interviewPrep = {
        platforms: ["Frontend Mentor", "CodeSandbox", "LeetCode (JS only)"],
        topics: ["JavaScript Fundamentals", "React Concepts", "CSS Layout", "System Design (Frontend)"],
        practice_type: "Build responsive websites and React projects"
      };
      practicePlatforms = ["Frontend Mentor", "CodePen", "CodeSandbox"];
    }
    
    // ============================================
    // BACKEND / API DEVELOPMENT
    // ============================================
    else if (roleLower.includes("backend") || roleLower.includes("api") || roleLower.includes("node") || roleLower.includes("django") || roleLower.includes("spring")) {
      coreSkills = ["Python/Java/Node.js", "REST APIs", "Database Design", "Authentication", "Server Architecture", "Microservices"];
      tools = ["Postman", "Docker", "PostgreSQL", "MongoDB", "Redis", "Git"];
      concepts = ["API Design", "Data Modeling", "Caching", "Security", "Load Balancing"];
      roleOverview = {
        what_this_role_does: "Backend Developers build the server-side logic, databases, and APIs that power websites and mobile apps behind the scenes.",
        why_important: "Backend systems handle data, security, and business logic. Without strong backend development, applications cannot function reliably or scale.",
        typical_responsibilities: ["Design and build APIs", "Create and manage databases", "Implement authentication and security", "Write server-side business logic", "Optimize performance and scalability", "Integrate with third-party services"],
        companies_that_hire: ["All tech companies", "Startups", "Banks", "E-commerce", "SaaS companies"]
      };
      resources = [
        { title: "Node.js Docs", url: "https://nodejs.org/docs", type: "documentation", is_free: true },
        { title: "Django Tutorial", url: "https://docs.djangoproject.com", type: "tutorial", is_free: true },
        { title: "PostgreSQL Tutorial", url: "https://postgresqltutorial.com", type: "tutorial", is_free: true }
      ];
      interviewPrep = {
        platforms: ["LeetCode", "HackerRank", "Pramp"],
        topics: ["Data Structures", "API Design", "Database Queries", "System Design"],
        practice_type: "Build APIs and solve coding problems"
      };
      practicePlatforms = ["LeetCode", "HackerRank", "Postman"];
    }
    
    // ============================================
    // DATA ANALYST / BI
    // ============================================
    else if (roleLower.includes("data analyst") || roleLower.includes("business analyst") || roleLower.includes("bi") || roleLower.includes("business intelligence") || roleLower.includes("analyst")) {
      coreSkills = ["SQL", "Excel", "Python/R", "Data Visualization", "Statistics", "Reporting"];
      tools = ["SQL Server", "Tableau", "Power BI", "Excel", "Google Sheets", "Python"];
      concepts = ["Data Cleaning", "Dashboard Design", "Statistical Analysis", "Business Metrics", "Storytelling"];
      roleOverview = {
        what_this_role_does: "Data Analysts collect, clean, and analyze data to create reports and dashboards that help businesses understand their performance and make decisions.",
        why_important: "Organizations need insights from their data to make smart decisions. Data Analysts turn raw data into actionable business intelligence.",
        typical_responsibilities: ["Collect and clean data from various sources", "Create reports and dashboards", "Perform statistical analysis", "Identify trends and patterns", "Present findings to stakeholders", "Support business decisions with data insights"],
        companies_that_hire: ["All companies", "Banks", "Retail", "Healthcare", "Consulting", "Marketing agencies"]
      };
      resources = [
        { title: "Google Data Analytics Certificate", url: "https://coursera.org/professional-certificates/google-data-analytics", type: "course", is_free: false },
        { title: "SQLZoo (Free)", url: "https://sqlzoo.net", type: "tutorial", is_free: true },
        { title: "Tableau Learning", url: "https://tableau.com/learn", type: "course", is_free: true }
      ];
      interviewPrep = {
        platforms: ["StrataScratch", "SQLPad", "DataCamp Projects"],
        topics: ["SQL Queries", "Case Studies", "Business Scenarios", "Dashboard Design"],
        practice_type: "Create dashboards and solve SQL problems"
      };
      practicePlatforms = ["Kaggle Datasets", "StrataScratch", "Google Data Studio"];
    }
    
    // ============================================
    // CYBERSECURITY
    // ============================================
    else if (roleLower.includes("security") || roleLower.includes("cyber") || roleLower.includes("pentest") || roleLower.includes("infosec")) {
      coreSkills = ["Network Security", "Penetration Testing", "Security Auditing", "Threat Analysis", "SIEM Tools", "Incident Response"];
      tools = ["Kali Linux", "Wireshark", "Metasploit", "Burp Suite", "Splunk", "Nessus"];
      concepts = ["Threat Modeling", "Vulnerability Assessment", "Compliance", "Risk Management", "Security Architecture"];
      roleOverview = {
        what_this_role_does: "Security professionals protect organizations from hackers, find vulnerabilities in systems, and ensure data and systems stay safe.",
        why_important: "Cyber threats are growing daily. Organizations need security experts to protect sensitive data, maintain customer trust, and avoid costly breaches.",
        typical_responsibilities: ["Monitor systems for security threats", "Perform penetration testing and vulnerability assessments", "Respond to security incidents", "Implement security measures and policies", "Conduct security audits", "Train employees on security best practices"],
        companies_that_hire: ["All enterprises", "Banks", "Government", "Security firms", "Consulting companies"]
      };
      resources = [
        { title: "TryHackMe (Free tier)", url: "https://tryhackme.com", type: "platform", is_free: true },
        { title: "HackTheBox", url: "https://hackthebox.com", type: "platform", is_free: true },
        { title: "CompTIA Security+", url: "https://comptia.org", type: "certification", is_free: false }
      ];
      interviewPrep = {
        platforms: ["TryHackMe", "HackTheBox", "CTF Competitions"],
        topics: ["Penetration Testing", "Security Scenarios", "Incident Response", "Compliance"],
        practice_type: "Complete CTF challenges and get certified"
      };
      practicePlatforms = ["TryHackMe", "HackTheBox", "CTFtime.org", "PortSwigger Academy"];
    }
    
    // ============================================
    // PROJECT MANAGER / PRODUCT
    // ============================================
    else if (roleLower.includes("project manager") || roleLower.includes("product manager") || roleLower.includes("scrum") || roleLower.includes("agile")) {
      coreSkills = ["Project Planning", "Agile/Scrum", "Stakeholder Management", "Risk Management", "Budgeting", "Team Leadership"];
      tools = ["Jira", "Confluence", "MS Project", "Asana", "Trello", "Excel"];
      concepts = ["Agile Methodology", "SDLC", "Resource Allocation", "Scope Management", "Communication"];
      roleOverview = {
        what_this_role_does: "Project Managers plan and coordinate projects, manage teams and timelines, and ensure projects are delivered on time and within budget.",
        why_important: "Projects fail without proper management. Project Managers ensure resources are used efficiently, risks are managed, and goals are achieved.",
        typical_responsibilities: ["Define project scope and objectives", "Create project plans and timelines", "Allocate resources and manage budgets", "Track progress and remove blockers", "Communicate with stakeholders", "Lead and motivate project teams"],
        companies_that_hire: ["All companies", "IT firms", "Consulting", "Construction", "Healthcare", "Manufacturing"]
      };
      resources = [
        { title: "PMI (PMP Certification)", url: "https://pmi.org", type: "certification", is_free: false },
        { title: "Google Project Management Certificate", url: "https://coursera.org/professional-certificates/google-project-management", type: "course", is_free: false },
        { title: "Atlassian Agile Coach", url: "https://atlassian.com/agile", type: "tutorial", is_free: true }
      ];
      interviewPrep = {
        platforms: ["PMI Community", "LinkedIn PM Groups", "Product School"],
        topics: ["Case Studies", "Situational Questions", "Agile Scenarios", "Leadership"],
        practice_type: "Lead projects and get PMP/CSM certified"
      };
      practicePlatforms = ["Jira Free", "Asana", "Miro", "Notion"];
    }
    
    // ============================================
    // UI/UX DESIGNER
    // ============================================
    else if (roleLower.includes("ui") || roleLower.includes("ux") || roleLower.includes("designer") || roleLower.includes("product design")) {
      coreSkills = ["User Research", "Wireframing", "Prototyping", "Visual Design", "Usability Testing", "Design Systems"];
      tools = ["Figma", "Sketch", "Adobe XD", "InVision", "Miro", "Principle"];
      concepts = ["User-Centered Design", "Information Architecture", "Interaction Design", "Accessibility", "Design Thinking"];
      roleOverview = {
        what_this_role_does: "UI/UX Designers create user-friendly designs for apps and websites. They research user needs, create wireframes, and design beautiful interfaces.",
        why_important: "Good design makes products easy and enjoyable to use. UI/UX Designers create experiences that attract users and keep them engaged.",
        typical_responsibilities: ["Conduct user research and interviews", "Create wireframes and prototypes", "Design visual interfaces", "Test designs with users", "Collaborate with developers", "Maintain design systems"],
        companies_that_hire: ["All tech companies", "Startups", "Design agencies", "E-commerce", "Banks"]
      };
      resources = [
        { title: "Google UX Certificate", url: "https://coursera.org/professional-certificates/google-ux-design", type: "course", is_free: false },
        { title: "Figma Academy (Free)", url: "https://figma.com/resources/learn-design", type: "course", is_free: true },
        { title: "Interaction Design Foundation", url: "https://interaction-design.org", type: "course", is_free: false }
      ];
      interviewPrep = {
        platforms: ["Dribbble", "Behance", "LinkedIn Design Groups"],
        topics: ["Design Case Studies", "Portfolio Review", "Design Challenges", "User Research Methods"],
        practice_type: "Build a strong portfolio with real projects"
      };
      practicePlatforms = ["Figma Community", "Dribbble", "Behance", "Daily UI"];
    }
    
    // ============================================
    // DEFAULT - GENERIC ROLE HANDLING
    // ============================================
    else {
      // Try to infer from keywords
      if (roleLower.includes("engineer") || roleLower.includes("developer") || roleLower.includes("programmer")) {
        coreSkills = ["Programming Fundamentals", "Problem Solving", "Version Control", "Testing", "Debugging"];
        tools = ["Git", "VS Code", "Docker", "CI/CD"];
        concepts = ["Software Design", "Clean Code", "Documentation"];
        interviewPrep = {
          platforms: ["LeetCode", "HackerRank"],
          topics: ["Problem Solving", "System Design"],
          practice_type: "Build projects and practice coding"
        };
        practicePlatforms = ["LeetCode", "GitHub", "HackerRank"];
      } else if (roleLower.includes("manager") || roleLower.includes("lead") || roleLower.includes("director")) {
        coreSkills = ["Leadership", "Planning", "Communication", "Team Management", "Strategy"];
        tools = ["Jira", "Excel", "PowerPoint", "Slack"];
        concepts = ["Management Principles", "Goal Setting", "Performance Management"];
        interviewPrep = {
          platforms: ["LinkedIn", "Industry Forums"],
          topics: ["Leadership Scenarios", "Case Studies", "Strategy"],
          practice_type: "Lead teams and get management certifications"
        };
        practicePlatforms = ["LinkedIn Learning", "Coursera Business"];
      } else {
        // Completely unknown role - provide generic but helpful roadmap
        coreSkills = ["Core Fundamentals", "Industry Knowledge", "Tools & Software", "Communication", "Problem Solving"];
        tools = ["Industry-standard tools", "Documentation", "Collaboration tools"];
        concepts = ["Best Practices", "Industry Standards", "Quality"];
        interviewPrep = {
          platforms: ["LinkedIn", "Industry Forums", "Professional Networks"],
          topics: ["Industry Knowledge", "Practical Scenarios", "Problem Solving"],
          practice_type: "Gain experience through projects and certifications"
        };
        practicePlatforms = ["LinkedIn Learning", "Coursera", "Industry-specific platforms"];
      }
      
      roleOverview = {
        what_this_role_does: `A ${targetRole} works in their specialized field, applying knowledge and skills to solve problems and create value.`,
        companies_that_hire: ["Companies in this field", "Startups", "Consulting firms", "Enterprises"]
      };
      resources = [
        { title: "LinkedIn Learning", url: "https://linkedin.com/learning", type: "platform", is_free: false },
        { title: "Coursera", url: "https://coursera.org", type: "platform", is_free: false },
        { title: "YouTube Tutorials", url: "https://youtube.com", type: "platform", is_free: true }
      ];
    }
    
    // ============================================
    // BUILD COMPREHENSIVE 10-SECTION ROADMAP
    // ============================================
    
    // Section 2: Skills by Category
    const skillsByCategory: SkillCategory[] = [
      {
        category_name: "Core Skills",
        skills: coreSkills,
        icon: "Code"
      },
      {
        category_name: "Tools & Technologies",
        skills: tools,
        icon: "Wrench"
      },
      {
        category_name: "Key Concepts",
        skills: concepts,
        icon: "Lightbulb"
      }
    ];
    
    // Section 3: Horizontal Learning Roadmap with Weekly Tasks
    const milestones: Milestone[] = [
      {
        id: "m1",
        title: "Phase 1: Foundations",
        phase: "Phase 1",
        description: `Start your journey as a ${targetRole}. Learn the fundamental concepts and set up your development environment.`,
        duration: `${basePhaseDuration} weeks`,
        status: "pending",
        goal: `Understand what ${targetRole} does and learn the basic skills to get started`,
        skills_to_learn: coreSkills.slice(0, 3).map(s => ({ skill: s, explanation: `Learn ${s} fundamentals`, category: "Core" })),
        resources: resources.slice(0, 2),
        weekly_tasks: Array.from({ length: basePhaseDuration }, (_, i) => ({
          week: i + 1,
          focus: i === 0 ? "Setup & Introduction" : i === 1 ? "Basic Concepts" : i === 2 ? "Hands-on Practice" : "Build First Project",
          tasks: [
            `Study ${coreSkills[i % coreSkills.length]} basics`,
            `Practice with ${tools[i % tools.length]}`,
            `Complete tutorial ${i + 1}`,
            `Document your learning`
          ]
        })),
        mini_project: {
          title: `Beginner ${targetRole} Project`,
          description: `Create a simple project to practice ${coreSkills[0]} and understand the basics`,
          technologies: [coreSkills[0], coreSkills[1], tools[0]],
          skills_learned: coreSkills.slice(0, 2),
          difficulty: "beginner"
        },
        milestone_outcome: `You will understand the basics of ${targetRole} and be able to create simple projects`,
        tasks: [
          { id: "t1_1", title: `Complete ${coreSkills[0]} fundamentals course`, completed: false },
          { id: "t1_2", title: `Set up ${tools[0]} and practice`, completed: false },
          { id: "t1_3", title: "Build your first beginner project", completed: false },
          { id: "t1_4", title: "Document what you learned", completed: false }
        ]
      },
      {
        id: "m2",
        title: "Phase 2: Core Development",
        phase: "Phase 2",
        description: `Deep dive into ${targetRole} skills. Build real projects and gain hands-on experience with industry tools.`,
        duration: `${basePhaseDuration} weeks`,
        status: "pending",
        goal: `Master the main tools and technologies used by ${targetRole}s in the industry`,
        skills_to_learn: coreSkills.slice(2, 5).map(s => ({ skill: s, explanation: `Master ${s} for real projects`, category: "Core" })),
        resources: resources,
        weekly_tasks: Array.from({ length: basePhaseDuration }, (_, i) => ({
          week: basePhaseDuration + i + 1,
          focus: i === 0 ? "Advanced Concepts" : i === 1 ? "Real-world Practice" : i === 2 ? "Project Building" : "Code Review",
          tasks: [
            `Learn ${coreSkills[(i + 2) % coreSkills.length]} in depth`,
            `Work with ${tools[(i + 1) % tools.length]}`,
            `Build project component ${i + 1}`,
            `Get feedback from community`
          ]
        })),
        mini_project: {
          title: `Intermediate ${targetRole} Application`,
          description: `Build a complete project that demonstrates your ${targetRole} skills`,
          technologies: coreSkills.slice(0, 4),
          skills_learned: coreSkills.slice(2, 5),
          difficulty: "intermediate"
        },
        milestone_outcome: `You can build complete ${targetRole} projects independently`,
        tasks: [
          { id: "t2_1", title: `Master ${coreSkills[2]} and ${coreSkills[3]}`, completed: false },
          { id: "t2_2", title: "Build an intermediate-level project", completed: false },
          { id: "t2_3", title: "Get code review and improve", completed: false },
          { id: "t2_4", title: "Deploy your project", completed: false }
        ]
      },
      {
        id: "m3",
        title: "Phase 3: Advanced Skills",
        phase: "Phase 3",
        description: `Learn advanced ${targetRole} concepts including architecture, best practices, and industry standards.`,
        duration: `${basePhaseDuration} weeks`,
        status: "pending",
        goal: "Master advanced concepts and build portfolio-worthy projects",
        skills_to_learn: concepts.slice(0, 4).map(s => ({ skill: s, explanation: `Apply ${s} in real projects`, category: "Concept" })),
        resources: resources,
        weekly_tasks: Array.from({ length: basePhaseDuration }, (_, i) => ({
          week: basePhaseDuration * 2 + i + 1,
          focus: i === 0 ? "Architecture Design" : i === 1 ? "Security & Optimization" : i === 2 ? "Portfolio Project" : "Documentation",
          tasks: [
            `Study ${concepts[i % concepts.length]}`,
            `Implement advanced feature ${i + 1}`,
            `Work on portfolio project`,
            `Write technical documentation`
          ]
        })),
        mini_project: {
          title: `Advanced ${targetRole} Portfolio Project`,
          description: `Build a production-ready project that showcases all your ${targetRole} skills`,
          technologies: [...coreSkills.slice(0, 4), ...tools.slice(0, 2)],
          skills_learned: [...coreSkills.slice(0, 4), ...concepts.slice(0, 2)],
          difficulty: "advanced"
        },
        milestone_outcome: `You have a strong portfolio and can handle complex ${targetRole} challenges`,
        tasks: [
          { id: "t3_1", title: "Learn advanced architecture concepts", completed: false },
          { id: "t3_2", title: "Build a portfolio-worthy project", completed: false },
          { id: "t3_3", title: "Write documentation and deploy", completed: false },
          { id: "t3_4", title: "Get community feedback", completed: false }
        ]
      },
      {
        id: "m4",
        title: "Phase 4: Job Ready",
        phase: "Phase 4",
        description: `Prepare for interviews, optimize your portfolio, and get ready to apply for ${targetRole} positions.`,
        duration: `${basePhaseDuration} weeks`,
        status: "pending",
        goal: "Be fully prepared for job interviews and applications",
        skills_to_learn: [
          { skill: "Interview Preparation", explanation: "Practice common interview questions", category: "Soft Skill" },
          { skill: "Portfolio Optimization", explanation: "Polish your projects for employers", category: "Soft Skill" },
          { skill: "Resume Building", explanation: "Create an ATS-friendly resume", category: "Soft Skill" }
        ],
        resources: interviewPrep.platforms.slice(0, 3).map((p: string) => ({ title: p, url: `https://${p.toLowerCase().replace(/\s/g, '')}.com`, type: "platform", is_free: true })),
        weekly_tasks: Array.from({ length: basePhaseDuration }, (_, i) => ({
          week: basePhaseDuration * 3 + i + 1,
          focus: i === 0 ? "Mock Interviews" : i === 1 ? "Resume & LinkedIn" : i === 2 ? "Job Applications" : "Final Prep",
          tasks: [
            `Practice interview questions`,
            `Polish project ${i + 1} in portfolio`,
            `Apply to 5-10 jobs`,
            `Network on LinkedIn`
          ]
        })),
        mini_project: {
          title: "Complete Portfolio Package",
          description: "Finalize your portfolio, resume, and online presence for job applications",
          technologies: ["Portfolio", "Resume", "LinkedIn"],
          skills_learned: ["Self-presentation", "Communication", "Networking"],
          difficulty: "beginner"
        },
        milestone_outcome: `You are ready to apply for ${targetRole} positions with confidence`,
        tasks: [
          { id: "t4_1", title: `${interviewPrep.practice_type}`, completed: false },
          { id: "t4_2", title: "Finalize your resume and LinkedIn", completed: false },
          { id: "t4_3", title: "Apply to 20+ relevant positions", completed: false },
          { id: "t4_4", title: "Practice mock interviews weekly", completed: false }
        ]
      }
    ];
    
    // Section 4: Project Roadmap
    const projectRoadmap: ProjectRoadmap = {
      beginner: [
        {
          title: `Simple ${targetRole} Starter`,
          description: `Your first project to practice ${coreSkills[0]} basics`,
          technologies: [coreSkills[0], tools[0]],
          skills_learned: coreSkills.slice(0, 2),
          difficulty: "beginner"
        },
        {
          title: `${targetRole} Practice Tool`,
          description: `Build a tool to practice ${coreSkills[1]}`,
          technologies: [coreSkills[1], tools[1]],
          skills_learned: coreSkills.slice(1, 3),
          difficulty: "beginner"
        }
      ],
      intermediate: [
        {
          title: `${targetRole} Application`,
          description: `A complete application using ${coreSkills.slice(0, 3).join(", ")}`,
          technologies: coreSkills.slice(0, 4),
          skills_learned: coreSkills.slice(0, 4),
          difficulty: "intermediate"
        },
        {
          title: `Real-world ${targetRole} Project`,
          description: `Solve a real problem using your ${targetRole} skills`,
          technologies: [...coreSkills.slice(0, 3), ...tools.slice(0, 2)],
          skills_learned: [...coreSkills.slice(0, 4), concepts[0]],
          difficulty: "intermediate"
        }
      ],
      advanced: [
        {
          title: `Enterprise ${targetRole} Solution`,
          description: `A production-ready project showcasing all your skills`,
          technologies: coreSkills,
          skills_learned: [...coreSkills, ...concepts.slice(0, 2)],
          difficulty: "advanced"
        },
        {
          title: `${targetRole} Portfolio Showcase`,
          description: `Your best work to show employers`,
          technologies: [...coreSkills.slice(0, 5), ...tools.slice(0, 3)],
          skills_learned: [...coreSkills, ...concepts.slice(0, 3)],
          difficulty: "advanced"
        }
      ]
    };
    
    // Section 6: Deployment & Industry Practices
    const deploymentJobPhase: DeploymentJobPhase = {
      how_to_deploy: "Deploy your projects to showcase them to employers",
      deployment_platforms: roleLower.includes("web") || roleLower.includes("frontend") ? ["Vercel", "Netlify", "GitHub Pages"] : ["Heroku", "AWS", "Google Cloud"],
      cloud_platforms: ["AWS", "Google Cloud", "Azure", "DigitalOcean"],
      cicd_tools: ["GitHub Actions", "Jenkins", "GitLab CI"],
      resume_tips: [
        "Quantify your achievements with numbers",
        "Use action verbs (Built, Developed, Implemented)",
        "Include relevant keywords for ATS",
        "Showcase your projects with links",
        "Highlight certifications and courses"
      ],
      job_application_strategy: `Apply to 10-15 ${targetRole} positions per week. Network on LinkedIn. Attend industry meetups. Contribute to open source.`
    };
    
    // Section 7: Portfolio Requirements
    const portfolioRequirements: PortfolioRequirements = {
      minimum_projects: 3,
      required_elements: [
        "Project description and your role",
        "Technologies used with explanations",
        "Live demo or screenshots",
        "GitHub repository with clean code",
        "README with setup instructions"
      ],
      github_expectations: [
        "Active contributions (green squares)",
        "Well-documented repositories",
        "Clean code structure",
        "Meaningful commit messages"
      ],
      documentation_tips: [
        "Write clear README files",
        "Include installation instructions",
        "Add usage examples",
        "Document your design decisions"
      ]
    };
    
    // Section 8: Learning Resources
    const learningResources: LearningResources = {
      free: resources.filter(r => r.is_free).map(r => ({ ...r, category: "free" as const })),
      paid: resources.filter(r => !r.is_free).map(r => ({ ...r, category: "paid" as const })),
      communities: [
        { title: `${targetRole} Reddit Community`, url: `https://reddit.com/r/${targetRole.toLowerCase().replace(/\s/g, "")}`, type: "community", is_free: true, category: "community" },
        { title: "Stack Overflow", url: "https://stackoverflow.com", type: "community", is_free: true, category: "community" },
        { title: "Discord Communities", url: "https://discord.com", type: "community", is_free: true, category: "community" },
        { title: "LinkedIn Groups", url: "https://linkedin.com", type: "community", is_free: true, category: "community" }
      ]
    };
    
    // Section 9: Skill Progress Tracker
    const skillProgressTracker: SkillProgressTracker = {
      categories: [
        {
          name: "Core Skills",
          percentage: 0,
          skills: coreSkills
        },
        {
          name: "Tools & Technologies",
          percentage: 0,
          skills: tools
        },
        {
          name: "Key Concepts",
          percentage: 0,
          skills: concepts
        },
        {
          name: "Projects Built",
          percentage: 0,
          skills: ["Beginner Projects", "Intermediate Projects", "Advanced Projects"]
        },
        {
          name: "Interview Prep",
          percentage: 0,
          skills: ["Mock Interviews", "Problem Solving", "Communication"]
        }
      ]
    };
    
    // Section 10: Final Career Outcome
    const finalCareerOutcome: FinalCareerOutcome = {
      can_build: [
        `Complete ${targetRole} solutions from scratch`,
        "Professional portfolio with 3+ projects",
        "Production-ready applications",
        "Well-documented open source contributions"
      ],
      can_apply_for: [
        `Junior ${targetRole}`,
        `Associate ${targetRole}`,
        `${targetRole} Intern`,
        `${targetRole} Trainee`
      ],
      interview_level: "Ready for entry-level to mid-level interviews",
      what_you_will_achieve: `After completing this roadmap, you will have the skills, projects, and confidence to apply for ${targetRole} positions at startups, product companies, and enterprises. You will be able to demonstrate your abilities through a strong portfolio and perform well in technical interviews.`
    };
    
    return {
      target_role: targetRole,
      current_level: currentLevel || "Beginner",
      experience_level: experienceLevel || "Fresher",
      time_commitment: timeCommitment,
      total_duration: `${totalWeeks} weeks`,
      total_weeks: totalWeeks,
      
      // Section 1
      role_overview: roleOverview,
      
      // Section 2
      skills_by_category: skillsByCategory,
      skills_to_learn: [...coreSkills, ...tools],
      
      // Section 3
      milestones,
      
      // Section 4
      project_roadmap: projectRoadmap,
      
      // Section 5
      interview_preparation: {
        dsa_practice: {
          platforms: practicePlatforms,
          topics_to_focus: interviewPrep.topics,
          problems_to_solve: 50
        },
        system_design_basics: {
          needed: roleLower.includes("engineer") || roleLower.includes("developer"),
          topics: concepts
        },
        mock_interview: {
          platforms: interviewPrep.platforms,
          frequency: "Practice weekly"
        },
        coding_platforms: practicePlatforms,
        recommended_problems: 50
      },
      
      // Section 6
      deployment_job_phase: deploymentJobPhase,
      
      // Section 7
      portfolio_requirements: portfolioRequirements,
      
      // Section 8
      learning_resources: learningResources,
      resources: resources.map(r => ({ title: r.title, url: r.url, type: r.type as "course" | "book" | "project" | "certification" })),
      
      // Section 9
      skill_progress_tracker: skillProgressTracker,
      
      // Section 10
      final_career_outcome: finalCareerOutcome,
      real_world_practice: {
        open_source_suggestion: `Join ${targetRole} communities and contribute to open source projects`,
        portfolio_requirement: "Build 3 complete projects for your portfolio",
        github_requirement: "Maintain an active GitHub with regular contributions",
        resume_readiness: "Tailor your resume for each job application"
      }
    };
  };

  const handleGenerate = async () => {
    if (!formData.targetRole) {
      toast({
        title: "Missing information",
        description: "Please enter your target role",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setRoadmap(null);

    try {
      // Generate dynamic roadmap directly in frontend
      const dynamicRoadmap = generateDynamicRoadmap(
        formData.targetRole,
        formData.currentLevel,
        formData.experienceLevel,
        formData.timeCommitment
      );
      
      setRoadmap(dynamicRoadmap);

      // Save to database
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && user?.id) {
          await supabase.from("roadmaps").insert({
            user_id: user.id,
            target_role: formData.targetRole,
            current_level: formData.currentLevel,
            experience_level: formData.experienceLevel,
            time_commitment: formData.timeCommitment,
            roadmap_data: dynamicRoadmap,
          });
        }
      } catch (dbError) {
        console.error("Failed to save roadmap:", dbError);
      }

      toast({
        title: "Roadmap Generated!",
        description: `Your ${formData.targetRole} roadmap is ready`,
      });
    } catch (e: any) {
      console.error("Roadmap generation error:", e);
      toast({
        title: "Generation Failed",
        description: e.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneIcon = (index: number) => {
    const icons = [BookOpen, Code, Briefcase, Users, Trophy];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-yellow-500";
      default: return "bg-gray-300";
    }
  };

  const toggleMilestone = (id: string) => {
    setExpandedMilestones(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalProgress = roadmap 
    ? Math.round((roadmap.milestones.filter(m => m.status === "completed").length / roadmap.milestones.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Career Roadmap Generator</h1>
          <p className="text-muted-foreground">AI-powered personalized learning path</p>
        </div>
        {roadmap && (
          <Button variant="outline" onClick={() => setRoadmap(null)}>
            Generate New Roadmap
          </Button>
        )}
      </div>

      {/* Input Form */}
      {!roadmap && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Define Your Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetRole">Target Role *</Label>
                <Input
                  id="targetRole"
                  value={formData.targetRole}
                  onChange={e => setFormData(prev => ({ ...prev, targetRole: e.target.value }))}
                  placeholder="e.g., Senior Software Engineer, Data Scientist"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="currentLevel">Current Level</Label>
                <Input
                  id="currentLevel"
                  value={formData.currentLevel}
                  onChange={e => setFormData(prev => ({ ...prev, currentLevel: e.target.value }))}
                  placeholder="e.g., Junior Developer, Student"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Experience Level</Label>
                <Select 
                  value={formData.experienceLevel} 
                  onValueChange={v => setFormData(prev => ({ ...prev, experienceLevel: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fresher">Fresher (0 years)</SelectItem>
                    <SelectItem value="junior">Junior (1-2 years)</SelectItem>
                    <SelectItem value="mid">Mid-level (3-5 years)</SelectItem>
                    <SelectItem value="senior">Senior (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Time Commitment</Label>
                <Select 
                  value={formData.timeCommitment} 
                  onValueChange={v => setFormData(prev => ({ ...prev, timeCommitment: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="part_time">Part-time (10 hrs/week)</SelectItem>
                    <SelectItem value="full_time">Full-time (40 hrs/week)</SelectItem>
                    <SelectItem value="intensive">Intensive (60+ hrs/week)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !formData.targetRole}
              className="w-full btn-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Roadmap
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading Overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <Sparkles className="w-16 h-16 text-primary" />
            </motion.div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-lg font-display gradient-text"
            >
              Creating your personalized roadmap...
            </motion.p>
            <p className="text-sm text-muted-foreground mt-2">Analyzing skills, resources, and milestones</p>
          </div>
        </motion.div>
      )}

      {/* Roadmap Display */}
      {roadmap && (
        <div className="space-y-6">
          {/* Header */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{roadmap.target_role}</h2>
                  <p className="text-sm text-muted-foreground">
                    {roadmap.total_duration} • {roadmap.milestones.length} milestones
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{totalProgress}%</div>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
              <Progress value={totalProgress} className="h-2" />
            </CardContent>
          </Card>

          {/* Role Overview */}
          {roadmap.role_overview && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Role Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{roadmap.role_overview.what_this_role_does}</p>
                
                {roadmap.role_overview.why_important && (
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                    <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                      <Star className="h-3 w-3" /> Why This Role Matters:
                    </p>
                    <p className="text-sm text-muted-foreground">{roadmap.role_overview.why_important}</p>
                  </div>
                )}
                
                {roadmap.role_overview.typical_responsibilities?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Typical Responsibilities:</p>
                    <ul className="space-y-1">
                      {roadmap.role_overview.typical_responsibilities.map((resp, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground pl-4 flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {roadmap.role_overview.companies_that_hire?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Companies That Hire:</p>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.role_overview.companies_that_hire.map((company, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{company}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Final Career Outcome */}
          {roadmap.final_career_outcome && (
            <Card className="glass-card bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Final Career Outcome
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmap.final_career_outcome.can_build?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> You Will Be Able To Build:
                    </p>
                    <ul className="space-y-1">
                      {roadmap.final_career_outcome.can_build.map((item, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground pl-4">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {roadmap.final_career_outcome.can_apply_for?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                      <Target className="h-3 w-3" /> You Can Apply For:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.final_career_outcome.can_apply_for.map((role, idx) => (
                        <Badge key={idx} className="bg-primary/10 text-primary">{role}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {roadmap.final_career_outcome.interview_level && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium">Interview Level: </span>
                    <Badge className="bg-amber-500/20 text-amber-400">{roadmap.final_career_outcome.interview_level}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Skills to Learn */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Skills to Develop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {roadmap.skills_to_learn.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Milestones Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Learning Path
            </h3>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
              
              {roadmap.milestones.map((milestone, idx) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-14 pb-8"
                >
                  {/* Timeline node */}
                  <div className={`absolute left-4 w-5 h-5 rounded-full ${getStatusColor(milestone.status)} border-4 border-background`} />
                  
                  <Card className="glass-card overflow-hidden">
                    {/* Milestone Header - Clickable */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => toggleMilestone(milestone.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getMilestoneIcon(idx)}
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            {milestone.phase && (
                              <p className="text-xs text-primary">{milestone.phase}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {milestone.duration}
                          </Badge>
                          {milestone.status === "completed" && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {expandedMilestones[milestone.id] ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      
                      {/* Always show goal if available */}
                      {milestone.goal && (
                        <p className="text-sm text-muted-foreground mt-2">{milestone.goal}</p>
                      )}
                    </div>
                    
                    {/* Expanded Content */}
                    {expandedMilestones[milestone.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="border-t border-border"
                      >
                        <div className="p-4 space-y-4">
                          {/* Skills to Learn */}
                          {milestone.skills_to_learn?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                                <BookOpen className="h-3 w-3" /> Skills to Learn:
                              </p>
                              <div className="space-y-2">
                                {milestone.skills_to_learn.map((s, i) => (
                                  <div key={i} className="bg-muted/10 p-2 rounded">
                                    <p className="text-sm font-medium">{s.skill}</p>
                                    <p className="text-xs text-muted-foreground">{s.explanation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* What You Can Do */}
                          {milestone.what_you_can_do?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> What You'll Be Able To Do:
                              </p>
                              <ul className="space-y-1">
                                {milestone.what_you_can_do.map((item, i) => (
                                  <li key={i} className="text-sm text-muted-foreground pl-4">• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Mini Project */}
                          {milestone.mini_project && (
                            <div className="bg-primary/5 p-3 rounded-lg">
                              <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                                <Code className="h-3 w-3" /> Mini Project:
                              </p>
                              <p className="text-sm font-medium">{milestone.mini_project.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{milestone.mini_project.description}</p>
                              {milestone.mini_project.technologies?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {milestone.mini_project.technologies.map((tech, i) => (
                                    <Badge key={i} className="text-xs bg-blue-500/10 text-blue-400">{tech}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Deliverable */}
                          {milestone.deliverable && (
                            <div className="bg-amber-500/5 p-3 rounded-lg">
                              <p className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                                <FileText className="h-3 w-3" /> Deliverable:
                              </p>
                              <p className="text-sm text-muted-foreground">{milestone.deliverable}</p>
                            </div>
                          )}

                          {/* How to Know Ready */}
                          {milestone.how_to_know_ready && (
                            <div className="bg-green-500/5 p-3 rounded-lg">
                              <p className="text-xs font-semibold text-green-400 mb-1 flex items-center gap-1">
                                <Target className="h-3 w-3" /> How To Know You're Ready:
                              </p>
                              <p className="text-sm text-muted-foreground">{milestone.how_to_know_ready}</p>
                            </div>
                          )}

                          {/* Important Tip */}
                          {milestone.important_tip && (
                            <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/20">
                              <p className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Important Tip:
                              </p>
                              <p className="text-sm text-muted-foreground">{milestone.important_tip}</p>
                            </div>
                          )}

                          {/* Resources for this milestone */}
                          {milestone.resources?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                                <BookOpen className="h-3 w-3" /> Resources:
                              </p>
                              <div className="space-y-2">
                                {milestone.resources.map((res, i) => (
                                  <a
                                    key={i}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                                  >
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{res.title}</p>
                                      <p className="text-xs text-muted-foreground">{res.type} {res.is_free !== undefined && (res.is_free ? '• Free' : '• Paid')}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Weekly Tasks */}
                          {milestone.weekly_tasks?.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 p-3 rounded-lg">
                              <p className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Weekly Breakdown:
                              </p>
                              <div className="space-y-2">
                                {milestone.weekly_tasks.map((week, i) => (
                                  <div key={i} className="bg-muted/20 p-2 rounded">
                                    <p className="text-xs font-medium text-primary mb-1">Week {week.week}: {week.focus}</p>
                                    <ul className="space-y-0.5">
                                      {week.tasks.map((task, j) => (
                                        <li key={j} className="text-xs text-muted-foreground pl-2 flex items-start gap-1">
                                          <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                                          {task}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Milestone Outcome */}
                          {milestone.milestone_outcome && (
                            <div className="bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                              <p className="text-xs font-semibold text-green-400 mb-1 flex items-center gap-1">
                                <Trophy className="h-3 w-3" /> Milestone Outcome:
                              </p>
                              <p className="text-sm text-muted-foreground">{milestone.milestone_outcome}</p>
                            </div>
                          )}

                          {/* Tasks */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Tasks:</p>
                            <div className="space-y-2">
                              {milestone.tasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-2 text-sm">
                                  {task.completed ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                                    {task.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Real World Practice */}
          {roadmap.real_world_practice && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Real-World Practice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmap.real_world_practice.open_source_suggestion && (
                  <div className="bg-muted/10 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1">
                      <Github className="h-3 w-3" /> Open Source:
                    </p>
                    <p className="text-sm text-muted-foreground">{roadmap.real_world_practice.open_source_suggestion}</p>
                  </div>
                )}
                {roadmap.real_world_practice.portfolio_requirement && (
                  <div className="bg-muted/10 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-purple-400 mb-1 flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> Portfolio:
                    </p>
                    <p className="text-sm text-muted-foreground">{roadmap.real_world_practice.portfolio_requirement}</p>
                  </div>
                )}
                {roadmap.real_world_practice.github_requirement && (
                  <div className="bg-muted/10 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-green-400 mb-1 flex items-center gap-1">
                      <Github className="h-3 w-3" /> GitHub:
                    </p>
                    <p className="text-sm text-muted-foreground">{roadmap.real_world_practice.github_requirement}</p>
                  </div>
                )}
                {roadmap.real_world_practice.resume_readiness && (
                  <div className="bg-muted/10 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Resume:
                    </p>
                    <p className="text-sm text-muted-foreground">{roadmap.real_world_practice.resume_readiness}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Interview Preparation */}
          {roadmap.interview_preparation && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Interview Preparation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmap.interview_preparation.dsa_practice && (
                  <div className="bg-blue-500/5 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1">
                      <Code className="h-3 w-3" /> DSA Practice:
                    </p>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {roadmap.interview_preparation.dsa_practice.platforms?.map((p, i) => (
                          <Badge key={i} className="bg-blue-500/10 text-blue-400">{p}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Focus: {roadmap.interview_preparation.dsa_practice.topics_to_focus?.join(", ")}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        Solve {roadmap.interview_preparation.dsa_practice.problems_to_solve}+ problems
                      </p>
                    </div>
                  </div>
                )}
                {roadmap.interview_preparation.system_design_basics?.needed && (
                  <div className="bg-purple-500/5 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                      <Map className="h-3 w-3" /> System Design:
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {roadmap.interview_preparation.system_design_basics.topics?.join(", ")}
                    </p>
                  </div>
                )}
                {roadmap.interview_preparation.mock_interview && (
                  <div className="bg-green-500/5 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Mock Interviews:
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {roadmap.interview_preparation.mock_interview.platforms?.map((p, i) => (
                        <Badge key={i} className="bg-green-500/10 text-green-400">{p}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Frequency: {roadmap.interview_preparation.mock_interview.frequency}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Deployment & Job Application */}
          {roadmap.deployment_job_phase && (
            <Card className="glass-card bg-gradient-to-r from-green-500/5 to-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-green-400" />
                  Deployment & Job Application
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmap.deployment_job_phase.how_to_deploy && (
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Deploy Projects:
                    </p>
                    <p className="text-sm text-muted-foreground">{roadmap.deployment_job_phase.how_to_deploy}</p>
                  </div>
                )}
                
                {roadmap.deployment_job_phase.deployment_platforms?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-400 mb-2">Deployment Platforms:</p>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.deployment_job_phase.deployment_platforms.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {roadmap.deployment_job_phase.cloud_platforms?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-purple-400 mb-2">Cloud Platforms:</p>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.deployment_job_phase.cloud_platforms.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {roadmap.deployment_job_phase.cicd_tools?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-400 mb-2">CI/CD Tools:</p>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.deployment_job_phase.cicd_tools.map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {roadmap.deployment_job_phase.resume_tips?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Resume Tips:
                    </p>
                    <ul className="space-y-1">
                      {roadmap.deployment_job_phase.resume_tips.map((tip, i) => (
                        <li key={i} className="text-sm text-muted-foreground pl-4">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {roadmap.deployment_job_phase.job_application_strategy && (
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                      <Target className="h-3 w-3" /> Job Application Strategy:
                    </p>
                    <p className="text-sm text-muted-foreground">{roadmap.deployment_job_phase.job_application_strategy}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Project Roadmap */}
          {roadmap.project_roadmap && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Project Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmap.project_roadmap.beginner?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                      <Star className="h-3 w-3" /> Beginner Projects:
                    </p>
                    <div className="space-y-2">
                      {roadmap.project_roadmap.beginner.map((proj, i) => (
                        <div key={i} className="bg-green-500/5 p-3 rounded-lg">
                          <p className="text-sm font-medium">{proj.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{proj.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proj.technologies.map((t, j) => (
                              <Badge key={j} className="text-xs bg-green-500/10 text-green-400">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {roadmap.project_roadmap.intermediate?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1">
                      <Code className="h-3 w-3" /> Intermediate Projects:
                    </p>
                    <div className="space-y-2">
                      {roadmap.project_roadmap.intermediate.map((proj, i) => (
                        <div key={i} className="bg-blue-500/5 p-3 rounded-lg">
                          <p className="text-sm font-medium">{proj.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{proj.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proj.technologies.map((t, j) => (
                              <Badge key={j} className="text-xs bg-blue-500/10 text-blue-400">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {roadmap.project_roadmap.advanced?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                      <Trophy className="h-3 w-3" /> Advanced Projects:
                    </p>
                    <div className="space-y-2">
                      {roadmap.project_roadmap.advanced.map((proj, i) => (
                        <div key={i} className="bg-purple-500/5 p-3 rounded-lg">
                          <p className="text-sm font-medium">{proj.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{proj.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proj.technologies.map((t, j) => (
                              <Badge key={j} className="text-xs bg-purple-500/10 text-purple-400">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Portfolio Requirements */}
          {roadmap.portfolio_requirements && (
            <Card className="glass-card bg-gradient-to-r from-amber-500/5 to-orange-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-400" />
                  Portfolio Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-500/10 p-3 rounded-lg">
                  <p className="text-sm font-medium text-amber-400">Minimum {roadmap.portfolio_requirements.minimum_projects} projects required</p>
                </div>
                
                {roadmap.portfolio_requirements.required_elements?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Required Elements:</p>
                    <ul className="space-y-1">
                      {roadmap.portfolio_requirements.required_elements.map((el, i) => (
                        <li key={i} className="text-sm text-muted-foreground pl-4 flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 mt-1 text-green-400" />
                          {el}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {roadmap.portfolio_requirements.github_expectations?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <Github className="h-3 w-3" /> GitHub Expectations:
                    </p>
                    <ul className="space-y-1">
                      {roadmap.portfolio_requirements.github_expectations.map((exp, i) => (
                        <li key={i} className="text-sm text-muted-foreground pl-4">• {exp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {roadmap.portfolio_requirements.documentation_tips?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Documentation Tips:</p>
                    <ul className="space-y-1">
                      {roadmap.portfolio_requirements.documentation_tips.map((tip, i) => (
                        <li key={i} className="text-sm text-muted-foreground pl-4">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Learning Resources */}
          {roadmap.learning_resources && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Learning Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmap.learning_resources.free?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Free Resources:
                    </p>
                    <div className="space-y-2">
                      {roadmap.learning_resources.free.map((res, i) => (
                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" 
                           className="flex items-center gap-2 p-2 rounded bg-green-500/5 hover:bg-green-500/10 transition-colors">
                          <BookOpen className="h-4 w-4 text-green-400" />
                          <span className="text-sm">{res.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {roadmap.learning_resources.paid?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1">
                      <Star className="h-3 w-3" /> Paid Courses:
                    </p>
                    <div className="space-y-2">
                      {roadmap.learning_resources.paid.map((res, i) => (
                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 p-2 rounded bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                          <BookOpen className="h-4 w-4 text-blue-400" />
                          <span className="text-sm">{res.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {roadmap.learning_resources.communities?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Communities:
                    </p>
                    <div className="space-y-2">
                      {roadmap.learning_resources.communities.map((res, i) => (
                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 p-2 rounded bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
                          <Users className="h-4 w-4 text-purple-400" />
                          <span className="text-sm">{res.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Skill Progress Tracker */}
          {roadmap.skill_progress_tracker && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Skill Progress Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmap.skill_progress_tracker.categories.map((cat, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{cat.name}</p>
                      <span className="text-xs text-muted-foreground">{cat.percentage}%</span>
                    </div>
                    <Progress value={cat.percentage} className="h-2" />
                    <div className="flex flex-wrap gap-1">
                      {cat.skills.map((skill, j) => (
                        <Badge key={j} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Resources */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Recommended Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roadmap.resources.map((resource, idx) => (
                  <a
                    key={idx}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="p-2 rounded bg-primary/10">
                      {resource.type === "course" && <BookOpen className="h-4 w-4 text-primary" />}
                      {resource.type === "project" && <Code className="h-4 w-4 text-primary" />}
                      {resource.type === "certification" && <Trophy className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{resource.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardRoadmap;
