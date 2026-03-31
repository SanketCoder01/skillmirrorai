import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { 
  Map, Target, Clock, Sparkles, CheckCircle, 
  Circle, ArrowRight, BookOpen, Code, Briefcase, Users,
  Trophy, Star, ChevronRight, Rocket, FileText, Github, Globe, 
  Award, TrendingUp, Play, Lock, Zap, Layers, RocketIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// ============================================
// TYPES
// ============================================
interface SkillToLearn {
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
  time_commitment?: string;
  total_duration: string;
  role_overview?: {
    what_this_role_does: string;
    companies_that_hire: string[];
  };
  final_career_outcome?: {
    can_build: string[];
    can_apply_for: string[];
    interview_level: string;
  };
  milestones: Milestone[];
  real_world_practice?: {
    open_source_suggestion: string;
    portfolio_requirement: string;
    github_requirement: string;
    resume_readiness: string;
  };
  interview_preparation?: {
    dsa_practice: {
      platforms: string[];
      topics_to_focus: string[];
      problems_to_solve: number;
    };
    system_design_basics: {
      needed: boolean;
      topics: string[];
    };
    mock_interview: {
      platforms: string[];
      frequency: string;
    };
  };
  deployment_job_phase?: {
    how_to_deploy: string;
    resume_tips: string[];
    job_application_strategy: string;
  };
  skills_to_learn: string[];
  resources: {
    title: string;
    url: string;
    type: "course" | "book" | "project" | "certification";
  }[];
}

interface RoadmapJourneyProps {
  roadmap: RoadmapData;
  onMilestoneToggle?: (id: string) => void;
}

// ============================================
// ANIMATED SKILL BUBBLE
// ============================================
const SkillBubble = ({ skill, index, delay = 0 }: { skill: string; index: number; delay?: number }) => {
  const colors = [
    "from-blue-500/20 to-cyan-500/20 border-blue-400/30",
    "from-purple-500/20 to-pink-500/20 border-purple-400/30",
    "from-green-500/20 to-emerald-500/20 border-green-400/30",
    "from-orange-500/20 to-amber-500/20 border-orange-400/30",
    "from-pink-500/20 to-rose-500/20 border-pink-400/30",
  ];
  const colorClass = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: delay + index * 0.05, type: "spring", stiffness: 200 }}
      whileHover={{ 
        scale: 1.1, 
        y: -5,
        boxShadow: "0 10px 40px -10px rgba(139, 92, 246, 0.3)"
      }}
      className={`px-4 py-2 rounded-full bg-gradient-to-r ${colorClass} border backdrop-blur-sm cursor-default`}
    >
      <span className="text-sm font-medium text-foreground">{skill}</span>
    </motion.div>
  );
};

// ============================================
// MILESTONE NODE
// ============================================
const MilestoneNode = ({ 
  milestone, 
  index, 
  isExpanded, 
  onToggle,
  totalMilestones 
}: { 
  milestone: Milestone; 
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  totalMilestones: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-gradient-to-r from-green-500 to-emerald-500",
          border: "border-green-400",
          glow: "shadow-green-500/50",
          icon: CheckCircle,
          text: "Completed"
        };
      case "in_progress":
        return {
          bg: "bg-gradient-to-r from-amber-500 to-orange-500",
          border: "border-amber-400",
          glow: "shadow-amber-500/50",
          icon: Play,
          text: "In Progress"
        };
      default:
        return {
          bg: "bg-gradient-to-r from-slate-600 to-slate-700",
          border: "border-slate-500",
          glow: "shadow-slate-500/30",
          icon: Lock,
          text: "Pending"
        };
    }
  };

  const config = getStatusConfig(milestone.status);
  const StatusIcon = config.icon;

  const getPhaseIcon = (phase?: string) => {
    if (!phase) return BookOpen;
    const phaseLower = phase.toLowerCase();
    if (phaseLower.includes("foundation")) return Layers;
    if (phaseLower.includes("core")) return Code;
    if (phaseLower.includes("advanced")) return TrendingUp;
    if (phaseLower.includes("practice")) return Briefcase;
    if (phaseLower.includes("interview")) return Users;
    if (phaseLower.includes("deploy")) return RocketIcon;
    return BookOpen;
  };

  const PhaseIcon = getPhaseIcon(milestone.phase);

  const taskProgress = milestone.tasks.length > 0
    ? Math.round((milestone.tasks.filter(t => t.completed).length / milestone.tasks.length) * 100)
    : 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, type: "spring" }}
      className={`relative ${index % 2 === 0 ? 'lg:pr-[50%] lg:mr-auto' : 'lg:pl-[50%] lg:ml-auto'} lg:w-1/2 w-full`}
    >
      {/* Connection Line to Center */}
      <div className={`hidden lg:block absolute top-1/2 ${index % 2 === 0 ? 'right-0' : 'left-0'} w-[calc(50%-2rem] h-0.5`}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
          className={`h-full bg-gradient-to-r ${index % 2 === 0 ? 'from-transparent to-primary/50' : 'from-primary/50 to-transparent'}`}
        />
      </div>

      {/* Node Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={onToggle}
        className={`relative cursor-pointer ${index % 2 === 0 ? 'lg:mr-8' : 'lg:ml-8'}`}
      >
        {/* Status Indicator */}
        <motion.div
          animate={milestone.status === "in_progress" ? { 
            boxShadow: ["0 0 20px rgba(245, 158, 11, 0.3)", "0 0 40px rgba(245, 158, 11, 0.5)", "0 0 20px rgba(245, 158, 11, 0.3)"]
          } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`absolute -left-3 top-6 w-6 h-6 rounded-full ${config.bg} flex items-center justify-center shadow-lg ${config.glow}`}
        >
          <StatusIcon className="h-3 w-3 text-white" />
        </motion.div>

        <Card className={`glass-card overflow-hidden border-l-4 ${config.border} ${milestone.status === "completed" ? 'bg-green-500/5' : milestone.status === "in_progress" ? 'bg-amber-500/5' : ''}`}>
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bg} bg-opacity-20`}>
                  <PhaseIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{milestone.title}</h3>
                  {milestone.phase && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {milestone.phase}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {milestone.duration}
                </Badge>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
                </motion.div>
              </div>
            </div>

            {/* Progress Bar */}
            {milestone.status !== "pending" && (
              <div className="px-4 pb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{taskProgress}%</span>
                </div>
                <Progress value={taskProgress} className="h-1.5" />
              </div>
            )}

            {/* Goal Preview */}
            {milestone.goal && !isExpanded && (
              <p className="px-4 pb-4 text-sm text-muted-foreground line-clamp-2">
                {milestone.goal}
              </p>
            )}

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-border overflow-hidden"
                >
                  <div className="p-4 space-y-4">
                    {/* Goal */}
                    {milestone.goal && (
                      <p className="text-sm text-muted-foreground">{milestone.goal}</p>
                    )}

                    {/* Skills to Learn */}
                    {milestone.skills_to_learn && milestone.skills_to_learn.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> Skills to Learn
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {milestone.skills_to_learn.map((s, i) => (
                            <SkillBubble key={i} skill={s.skill} index={i} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* What You Can Do */}
                    {milestone.what_you_can_do && milestone.what_you_can_do.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> You'll Be Able To
                        </h4>
                        <ul className="space-y-1">
                          {milestone.what_you_can_do.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <ArrowRight className="h-3 w-3 mt-1 text-green-400" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mini Project */}
                    {milestone.mini_project && (
                      <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                        <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                          <Code className="h-3 w-3" /> Mini Project
                        </h4>
                        <p className="text-sm font-medium">{milestone.mini_project.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{milestone.mini_project.description}</p>
                        {milestone.mini_project.technologies && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {milestone.mini_project.technologies.map((tech, i) => (
                              <Badge key={i} className="text-xs bg-blue-500/10 text-blue-400">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tasks */}
                    {milestone.tasks && milestone.tasks.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Tasks</h4>
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
                    )}

                    {/* Resources */}
                    {milestone.resources && milestone.resources.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> Resources
                        </h4>
                        <div className="space-y-2">
                          {milestone.resources.map((res, i) => (
                            <a
                              key={i}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors group"
                            >
                              <BookOpen className="h-4 w-4 text-primary" />
                              <div className="flex-1">
                                <p className="text-sm font-medium group-hover:text-primary transition-colors">{res.title}</p>
                                <p className="text-xs text-muted-foreground">{res.type}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// REAL WORLD PRACTICE CARD
// ============================================
const PracticeCard = ({ 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.03, y: -5 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="relative overflow-hidden"
  >
    <Card className="glass-card h-full">
      <CardContent className="p-5">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}
        >
          <Icon className="h-6 w-6 text-white" />
        </motion.div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

// ============================================
// INTERVIEW PLATFORM CARD
// ============================================
const InterviewPlatformCard = ({ name, type }: { name: string; type: string }) => {
  const colors: Record<string, string> = {
    leetcode: "from-orange-500 to-amber-500",
    hackerrank: "from-green-500 to-emerald-500",
    codechef: "from-amber-500 to-yellow-500",
    pramp: "from-blue-500 to-cyan-500",
    interviewing: "from-purple-500 to-pink-500",
    codesignal: "from-red-500 to-rose-500",
  };
  
  const colorKey = name.toLowerCase().replace(/[^a-z]/g, '');
  const gradient = colors[colorKey] || "from-slate-500 to-slate-600";

  return (
    <motion.a
      href={`https://${name.toLowerCase().replace(/\s/g, '')}.com`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -3 }}
      className="block"
    >
      <Card className="glass-card overflow-hidden group">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center`}>
            <Code className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium group-hover:text-primary transition-colors">{name}</p>
            <p className="text-xs text-muted-foreground">{type}</p>
          </div>
        </CardContent>
      </Card>
    </motion.a>
  );
};

// ============================================
// DEPLOYMENT STEP
// ============================================
const DeploymentStep = ({ 
  step, 
  index, 
  isLast 
}: { 
  step: { icon: any; title: string; description: string }; 
  index: number;
  isLast: boolean;
}) => {
  const Icon = step.icon;
  
  return (
    <div className="flex items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className="relative"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-bold">
          {index + 1}
        </div>
      </motion.div>
      <div className="ml-4">
        <h4 className="font-semibold">{step.title}</h4>
        <p className="text-sm text-muted-foreground">{step.description}</p>
      </div>
      {!isLast && (
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ delay: 0.2 }}
          className="hidden md:block mx-4"
        >
          <ArrowRight className="h-6 w-6 text-primary" />
        </motion.div>
      )}
    </div>
  );
};

// ============================================
// RESOURCE CARD
// ============================================
const ResourceCard = ({ resource, index }: { resource: { title: string; url: string; type: string }; index: number }) => {
  const typeIcons: Record<string, any> = {
    course: BookOpen,
    book: BookOpen,
    project: Code,
    certification: Award,
  };
  const Icon = typeIcons[resource.type] || BookOpen;

  return (
    <motion.a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -3 }}
      className="block"
    >
      <Card className="glass-card overflow-hidden group h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                {resource.title}
              </h4>
              <p className="text-xs text-muted-foreground capitalize mt-1">{resource.type}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.a>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const RoadmapJourney = ({ roadmap, onMilestoneToggle }: RoadmapJourneyProps) => {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  
  const totalProgress = Math.round(
    (roadmap.milestones.filter(m => m.status === "completed").length / roadmap.milestones.length) * 100
  );

  const completedCount = roadmap.milestones.filter(m => m.status === "completed").length;
  const inProgressCount = roadmap.milestones.filter(m => m.status === "in_progress").length;

  // Deployment steps
  const deploymentSteps = roadmap.deployment_job_phase ? [
    { icon: Rocket, title: "Deploy Projects", description: roadmap.deployment_job_phase.how_to_deploy?.substring(0, 50) + "..." || "Live portfolio" },
    { icon: FileText, title: "Optimize Resume", description: "ATS-friendly format" },
    { icon: Target, title: "Apply for Jobs", description: roadmap.deployment_job_phase.job_application_strategy?.substring(0, 50) + "..." || "Target companies" },
    { icon: Trophy, title: "Get Hired", description: "Interview success" },
  ] : [];

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Fixed Progress Header */}
      <motion.div
        style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0.9]) }}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">{roadmap.target_role}</h1>
              <p className="text-xs text-muted-foreground">{roadmap.total_duration} • {roadmap.milestones.length} milestones</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{totalProgress}%</div>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
              <div className="w-32">
                <Progress value={totalProgress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-primary to-purple-500 mb-6 shadow-lg shadow-primary/30"
          >
            <Map className="h-10 w-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold mb-2">Your Career Journey</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Follow this personalized path to become job-ready as a {roadmap.target_role}
          </p>
        </motion.div>

        {/* Skills Section */}
        <section>
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-xl font-bold mb-6 flex items-center gap-2"
          >
            <Star className="h-5 w-5 text-yellow-500" />
            Skills to Develop
          </motion.h3>
          <div className="flex flex-wrap gap-3">
            {roadmap.skills_to_learn.map((skill, i) => (
              <SkillBubble key={i} skill={skill} index={i} />
            ))}
          </div>
        </section>

        {/* Milestones Journey */}
        <section>
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-xl font-bold mb-8 flex items-center gap-2"
          >
            <Map className="h-5 w-5 text-primary" />
            Learning Path
            <Badge variant="secondary" className="ml-2">
              {completedCount}/{roadmap.milestones.length} completed
            </Badge>
          </motion.h3>

          {/* Central Timeline Line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-purple-500 to-green-500 opacity-20" style={{ transform: 'translateX(-50%)' }} />

          <div className="relative space-y-8">
            {roadmap.milestones.map((milestone, index) => (
              <MilestoneNode
                key={milestone.id}
                milestone={milestone}
                index={index}
                isExpanded={expandedMilestone === milestone.id}
                onToggle={() => setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)}
                totalMilestones={roadmap.milestones.length}
              />
            ))}
          </div>
        </section>

        {/* Real World Practice */}
        {roadmap.real_world_practice && (
          <section>
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-xl font-bold mb-6 flex items-center gap-2"
            >
              <Globe className="h-5 w-5 text-primary" />
              Real-World Practice
            </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <PracticeCard
                icon={Github}
                title="Open Source"
                description={roadmap.real_world_practice.open_source_suggestion?.substring(0, 80) || "Contribute to projects"}
                color="bg-gradient-to-r from-slate-700 to-slate-800"
              />
              <PracticeCard
                icon={Briefcase}
                title="Portfolio"
                description={roadmap.real_world_practice.portfolio_requirement?.substring(0, 80) || "Build showcase projects"}
                color="bg-gradient-to-r from-purple-500 to-pink-500"
              />
              <PracticeCard
                icon={Code}
                title="GitHub Activity"
                description={roadmap.real_world_practice.github_requirement?.substring(0, 80) || "Regular contributions"}
                color="bg-gradient-to-r from-green-500 to-emerald-500"
              />
              <PracticeCard
                icon={FileText}
                title="Resume Ready"
                description={roadmap.real_world_practice.resume_readiness?.substring(0, 80) || "ATS optimized"}
                color="bg-gradient-to-r from-amber-500 to-orange-500"
              />
            </div>
          </section>
        )}

        {/* Interview Preparation */}
        {roadmap.interview_preparation && (
          <section>
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-xl font-bold mb-6 flex items-center gap-2"
            >
              <Award className="h-5 w-5 text-yellow-500" />
              Interview Preparation
            </motion.h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* DSA Practice */}
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Code className="h-5 w-5 text-blue-400" />
                    </div>
                    <h4 className="font-semibold">DSA Practice</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Solve {roadmap.interview_preparation.dsa_practice?.problems_to_solve || 100}+ problems
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(roadmap.interview_preparation.dsa_practice?.platforms || ["LeetCode", "HackerRank"]).map((p, i) => (
                      <InterviewPlatformCard key={i} name={p} type="DSA" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Design */}
              {roadmap.interview_preparation.system_design_basics?.needed && (
                <Card className="glass-card">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Layers className="h-5 w-5 text-purple-400" />
                      </div>
                      <h4 className="font-semibold">System Design</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.interview_preparation.system_design_basics.topics?.map((t, i) => (
                        <Badge key={i} className="bg-purple-500/10 text-purple-400">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mock Interviews */}
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Users className="h-5 w-5 text-green-400" />
                    </div>
                    <h4 className="font-semibold">Mock Interviews</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {roadmap.interview_preparation.mock_interview?.frequency || "Weekly practice"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(roadmap.interview_preparation.mock_interview?.platforms || ["Pramp"]).map((p, i) => (
                      <InterviewPlatformCard key={i} name={p} type="Mock" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Deployment & Job Application */}
        {deploymentSteps.length > 0 && (
          <section>
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-xl font-bold mb-6 flex items-center gap-2"
            >
              <Rocket className="h-5 w-5 text-green-400" />
              Deployment & Job Application
            </motion.h3>
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0 justify-between">
              {deploymentSteps.map((step, i) => (
                <DeploymentStep
                  key={i}
                  step={step}
                  index={i}
                  isLast={i === deploymentSteps.length - 1}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recommended Resources */}
        <section>
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-xl font-bold mb-6 flex items-center gap-2"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            Recommended Resources
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmap.resources.map((resource, i) => (
              <ResourceCard key={i} resource={resource} index={i} />
            ))}
          </div>
        </section>

        {/* Final Career Outcome */}
        {roadmap.final_career_outcome && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <Card className="glass-card bg-gradient-to-r from-primary/10 via-purple-500/10 to-green-500/10 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold">Final Career Outcome</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> You'll Be Able To Build
                    </h4>
                    <ul className="space-y-2">
                      {roadmap.final_career_outcome.can_build?.map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Zap className="h-4 w-4 text-primary" />
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-1">
                      <Target className="h-4 w-4" /> You Can Apply For
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.final_career_outcome.can_apply_for?.map((role, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 cursor-default">
                            {role}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {roadmap.final_career_outcome.interview_level && (
                  <div className="mt-6 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 inline-flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-400" />
                    <span className="font-medium">Interview Level:</span>
                    <Badge className="bg-amber-500/20 text-amber-400">
                      {roadmap.final_career_outcome.interview_level}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        )}
      </div>
    </div>
  );
};

export default RoadmapJourney;
