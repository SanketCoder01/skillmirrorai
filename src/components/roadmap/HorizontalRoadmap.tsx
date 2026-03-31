import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { 
  Map, Target, Clock, CheckCircle, Lock, Play, 
  BookOpen, Code, Briefcase, Users, Trophy, Star,
  Rocket, FileText, Github, Globe, Award, TrendingUp,
  Layers, Zap, ArrowRight, ChevronRight, X, ExternalLink,
  Sparkles, Flame, Gem, Crown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Milestone {
  id: string;
  title: string;
  phase?: string;
  description?: string;
  duration: string;
  status: "completed" | "in_progress" | "pending";
  goal?: string;
  what_to_learn?: string[];
  where_to_learn?: Resource[];
  practice_tasks?: string[];
  skills_to_learn?: SkillToLearn[];
  what_you_can_do?: string[];
  mini_project?: MiniProject;
  deliverable?: string;
  how_to_know_ready?: string;
  resources?: Resource[];
  important_tip?: string;
  skills_gained?: string[];
  tasks: Task[];
}

interface WeeklyPlan {
  week: number;
  focus: string;
  tasks: string[];
}

interface ProjectIdea {
  title: string;
  description: string;
  skills_used: string[];
}

interface RoadmapData {
  target_role: string;
  current_level: string;
  experience_level: string;
  time_commitment?: string;
  total_duration: string;
  
  // 1. Career Overview
  career_overview?: {
    what_this_role_does: string;
    where_this_role_is_used: string;
    companies_that_hire: string[];
  };
  
  // 2. Skills Required
  skills_required?: {
    core_technical: string[];
    tools_and_technologies: string[];
    conceptual_knowledge: string[];
  };
  
  // 3. Learning Journey
  milestones: Milestone[];
  
  // 4. Weekly Learning Plan
  weekly_plan?: WeeklyPlan[];
  
  // 5. Practice Platforms
  practice_platforms?: {
    name: string;
    url: string;
    how_it_helps: string;
  }[];
  
  // 6. Project Ideas
  project_ideas?: {
    beginner: ProjectIdea[];
    intermediate: ProjectIdea[];
    advanced: ProjectIdea[];
  };
  
  // 7. Interview Preparation
  interview_preparation?: {
    important_topics?: string[];
    practice_strategy?: string;
    mock_interview_platforms?: {
      name: string;
      url: string;
    }[];
    dsa_practice?: {
      platforms: string[];
      topics_to_focus: string[];
      problems_to_solve: number;
    };
    system_design_basics?: {
      needed: boolean;
      topics: string[];
    };
    mock_interview?: {
      platforms: string[];
      frequency: string;
    };
  };
  
  // 8. Job Preparation
  job_preparation?: {
    portfolio_tips: string[];
    github_tips: string[];
    resume_tips: string[];
    application_strategy: string;
  };
  
  // 9. Career Outcome
  career_outcome?: {
    what_you_can_build: string[];
    what_you_can_apply_for: string[];
    interview_readiness: string;
  };
  
  // Legacy fields
  role_overview?: {
    what_this_role_does: string;
    companies_that_hire: string[];
  };
  final_career_outcome?: {
    can_build: string[];
    can_apply_for: string[];
    interview_level: string;
  };
  real_world_practice?: {
    open_source_suggestion: string;
    portfolio_requirement: string;
    github_requirement: string;
    resume_readiness: string;
  };
  deployment_job_phase?: {
    how_to_deploy: string;
    resume_tips: string[];
    job_application_strategy: string;
  };
  skills_to_learn: string[];
  resources: Resource[];
}

interface HorizontalRoadmapProps {
  roadmap: RoadmapData;
  onTaskToggle?: (milestoneId: string, taskId: string) => void;
}

// ============================================
// MILESTONE NODE COMPONENT
// ============================================
const MilestoneNode = ({ 
  milestone, 
  index, 
  isSelected,
  onClick,
  isLast
}: { 
  milestone: Milestone;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  isLast: boolean;
}) => {
  const getNodeConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          gradient: "from-green-500 to-emerald-400",
          glowColor: "shadow-green-500/50",
          border: "border-green-400",
          Icon: CheckCircle,
          label: "Completed"
        };
      case "in_progress":
        return {
          gradient: "from-amber-500 to-orange-400",
          glowColor: "shadow-amber-500/50",
          border: "border-amber-400",
          Icon: Play,
          label: "In Progress"
        };
      default:
        // All pending milestones are now unlocked and clickable
        return {
          gradient: "from-primary to-purple-500",
          glowColor: "shadow-primary/30",
          border: "border-primary",
          Icon: BookOpen,
          label: "Start Here"
        };
    }
  };

  const config = getNodeConfig(milestone.status);
  const NodeIcon = config.Icon;

  const getPhaseIcon = (phase?: string) => {
    if (!phase) return BookOpen;
    const p = phase.toLowerCase();
    if (p.includes("foundation")) return Layers;
    if (p.includes("core")) return Code;
    if (p.includes("advanced")) return TrendingUp;
    if (p.includes("practice")) return Briefcase;
    if (p.includes("interview")) return Users;
    if (p.includes("deploy")) return Rocket;
    return BookOpen;
  };

  const PhaseIcon = getPhaseIcon(milestone.phase);

  return (
    <div className="flex items-center">
      {/* Node */}
      <motion.div
        initial={{ scale: 0, opacity: 0, rotateY: -90 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ delay: index * 0.15, type: "spring", stiffness: 200, damping: 15 }}
        whileHover={{ 
          scale: 1.15, 
          rotateY: 10,
          rotateX: -5,
          z: 50,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="relative cursor-pointer perspective-1000"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Animated Glow Ring */}
        <motion.div
          animate={{ 
            rotate: 360,
            boxShadow: [
              "0 0 20px rgba(139, 92, 246, 0.3)",
              "0 0 40px rgba(139, 92, 246, 0.5)",
              "0 0 20px rgba(139, 92, 246, 0.3)"
            ]
          }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 8, ease: "linear" },
            boxShadow: { repeat: Infinity, duration: 2 }
          }}
          className="absolute inset-0 rounded-full"
        />

        {/* 3D Floating Particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/40"
            animate={{
              y: [-10, -30, -10],
              x: [0, (i - 1) * 10, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              repeat: Infinity,
              duration: 2 + i * 0.5,
              delay: i * 0.3
            }}
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)"
            }}
          />
        ))}

        {/* Main Node Circle with 3D Effect */}
        <div 
          className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-xl ${config.glowColor} transition-all duration-300 ${isSelected ? "ring-4 ring-primary ring-offset-2 ring-offset-background" : ""}`}
          style={{ 
            boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
            transform: "translateZ(20px)"
          }}
        >
          {/* Inner Glow */}
          <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-sm" />
          
          {/* Phase Icon */}
          <PhaseIcon className="h-8 w-8 text-white relative z-10 drop-shadow-lg" />
          
          {/* Status Badge with 3D */}
          <motion.div 
            whileHover={{ scale: 1.2, rotate: 10 }}
            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 ${config.border} flex items-center justify-center shadow-lg`}
            style={{ transform: "translateZ(10px)" }}
          >
            <NodeIcon className="h-3 w-3 text-muted-foreground" />
          </motion.div>
        </div>

        {/* Label Below with 3D Effect */}
        <motion.div 
          className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-32 text-center"
          style={{ transform: "translateZ(5px)" }}
        >
          <p className="text-sm font-semibold text-foreground line-clamp-2 drop-shadow-sm">{milestone.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            {milestone.duration}
          </p>
        </motion.div>
      </motion.div>

      {/* Connector Arrow with Animation */}
      {!isLast && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: index * 0.15 + 0.1, duration: 0.3 }}
          className="flex items-center mx-4 relative"
        >
          {/* Animated Path */}
          <motion.div
            className={`w-16 h-1 rounded-full overflow-hidden ${milestone.status === "completed" ? "bg-green-500/20" : milestone.status === "in_progress" ? "bg-amber-500/20" : "bg-slate-700/50"}`}
          >
            <motion.div
              className={`h-full rounded-full ${milestone.status === "completed" ? "bg-gradient-to-r from-green-500 to-emerald-400" : milestone.status === "in_progress" ? "bg-gradient-to-r from-amber-500 to-orange-400" : "bg-gradient-to-r from-primary to-purple-500"}`}
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ delay: index * 0.15 + 0.2, duration: 0.5 }}
            />
          </motion.div>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ArrowRight className={`h-4 w-4 -ml-1 ${milestone.status === "completed" ? "text-green-400" : milestone.status === "in_progress" ? "text-amber-400" : "text-primary"}`} />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// ============================================
// MILESTONE DETAIL CARD
// ============================================
const MilestoneDetailCard = ({ 
  milestone, 
  onClose,
  onTaskToggle 
}: { 
  milestone: Milestone;
  onClose: () => void;
  onTaskToggle?: (taskId: string) => void;
}) => {
  const taskProgress = milestone.tasks.length > 0
    ? Math.round((milestone.tasks.filter(t => t.completed).length / milestone.tasks.length) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.9, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: 100, scale: 0.9, rotateX: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed inset-x-4 md:inset-x-auto md:w-[500px] mx-auto bottom-4 z-50 perspective-1000"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Animated Background Glow */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 blur-xl"
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.02, 1]
        }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
      
      <Card className="glass-card border-2 border-primary/30 shadow-2xl shadow-primary/20 max-h-[70vh] overflow-hidden relative backdrop-blur-xl">
        {/* Animated Border Gradient */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)",
            backgroundSize: "200% 100%"
          }}
          animate={{
            backgroundPosition: ["200% 0", "-200% 0"]
          }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        />
        
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-primary/20 p-4 flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              {milestone.phase && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <Badge variant="outline" className="text-xs border-primary/50 text-primary">{milestone.phase}</Badge>
                </motion.div>
              )}
              <Badge variant="secondary" className="text-xs bg-primary/10">
                <Clock className="h-3 w-3 mr-1" />
                {milestone.duration}
              </Badge>
            </div>
            <h3 className="text-lg font-bold mt-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{milestone.title}</h3>
          </div>
          <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-primary/20">
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(70vh-80px)] p-4 space-y-4">
          {/* Progress with Animation */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Progress
              </span>
              <motion.span 
                className="font-semibold text-primary"
                key={taskProgress}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {taskProgress}%
              </motion.span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-primary"
                initial={{ x: "-100%" }}
                animate={{ x: `${-100 + taskProgress}%` }}
                transition={{ type: "spring", stiffness: 50 }}
              />
              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
            </div>
          </div>

          {/* Goal */}
          {milestone.goal && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50"
            >
              <Target className="h-4 w-4 inline mr-2 text-primary" />
              {milestone.goal}
            </motion.p>
          )}

          {/* Skills to Learn */}
          {milestone.skills_to_learn && milestone.skills_to_learn.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Skills to Learn
              </h4>
              <div className="flex flex-wrap gap-2">
                {milestone.skills_to_learn.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary text-xs font-medium border border-primary/30 shadow-sm"
                  >
                    {s.skill}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* What to Learn */}
          {milestone.what_to_learn && milestone.what_to_learn.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> What to Learn
              </h4>
              <div className="flex flex-wrap gap-2">
                {milestone.what_to_learn.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20"
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Skills Gained */}
          {milestone.skills_gained && milestone.skills_gained.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Skills You'll Gain
              </h4>
              <div className="flex flex-wrap gap-2">
                {milestone.skills_gained.map((skill, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20"
                  >
                    {skill}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {milestone.tasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Tasks</h4>
              <div className="space-y-2">
                {milestone.tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    whileHover={{ backgroundColor: "rgba(var(--muted), 0.5)" }}
                    onClick={() => onTaskToggle?.(task.id)}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.completed ? "bg-green-500 border-green-500" : "border-muted-foreground"}`}>
                      {task.completed && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </span>
                  </motion.div>
                ))}
              </div>
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
                    <Badge key={i} className="text-xs bg-blue-500/10 text-blue-400">{tech}</Badge>
                  ))}
                </div>
              )}
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
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <ExternalLink className="h-4 w-4 text-primary" />
                    <span className="text-sm group-hover:text-primary transition-colors">{res.title}</span>
                    <Badge variant="outline" className="text-xs ml-auto">{res.type}</Badge>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// ============================================
// SKILL TAG COMPONENT
// ============================================
const SkillTag = ({ skill, index }: { skill: string; index: number }) => {
  const colors = [
    "from-blue-500/20 to-cyan-500/20 border-blue-400/40 text-blue-300",
    "from-purple-500/20 to-pink-500/20 border-purple-400/40 text-purple-300",
    "from-green-500/20 to-emerald-500/20 border-green-400/40 text-green-300",
    "from-orange-500/20 to-amber-500/20 border-orange-400/40 text-orange-300",
    "from-pink-500/20 to-rose-500/20 border-pink-400/40 text-pink-300",
    "from-cyan-500/20 to-teal-500/20 border-cyan-400/40 text-cyan-300",
  ];
  const colorClass = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.1, y: -3 }}
      className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${colorClass} border text-xs font-medium cursor-default`}
    >
      {skill}
    </motion.div>
  );
};

// ============================================
// PRACTICE CARD COMPONENT
// ============================================
const PracticeCard = ({ 
  icon: Icon, 
  title, 
  description, 
  gradient 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  gradient: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.03, y: -5 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Card className="glass-card h-full overflow-hidden group">
      <CardContent className="p-5">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4 shadow-lg`}
        >
          <Icon className="h-6 w-6 text-white" />
        </motion.div>
        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

// ============================================
// DEPLOYMENT STEP COMPONENT
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
        className="flex flex-col items-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">
          {index + 1}
        </div>
        <div className="mt-3 text-center">
          <h4 className="text-sm font-semibold">{step.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-[100px]">{step.description}</p>
        </div>
      </motion.div>
      
      {!isLast && (
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          className="flex items-center mx-2"
        >
          <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-purple-500" />
          <ArrowRight className="h-4 w-4 text-primary -ml-1" />
        </motion.div>
      )}
    </div>
  );
};

// ============================================
// MAIN HORIZONTAL ROADMAP COMPONENT
// ============================================
const HorizontalRoadmap = ({ roadmap, onTaskToggle }: HorizontalRoadmapProps) => {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [localMilestones, setLocalMilestones] = useState(roadmap.milestones);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pathControls = useAnimation();

  // Calculate progress
  const completedCount = localMilestones.filter(m => m.status === "completed").length;
  const totalProgress = Math.round((completedCount / localMilestones.length) * 100);

  // Animate path on mount
  useEffect(() => {
    pathControls.start({
      pathLength: 1,
      transition: { duration: 2, ease: "easeInOut" }
    });
  }, [pathControls]);

  // Handle task toggle locally
  const handleTaskToggle = (milestoneId: string, taskId: string) => {
    setLocalMilestones(prev => prev.map(m => {
      if (m.id === milestoneId) {
        const updatedTasks = m.tasks.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        const completedTasks = updatedTasks.filter(t => t.completed).length;
        const newStatus = completedTasks === updatedTasks.length ? "completed" : 
                         completedTasks > 0 ? "in_progress" : m.status;
        return { ...m, tasks: updatedTasks, status: newStatus };
      }
      return m;
    }));
    onTaskToggle?.(milestoneId, taskId);
  };

  // Deployment steps
  const deploymentSteps = roadmap.deployment_job_phase ? [
    { icon: Rocket, title: "Deploy", description: "Live projects" },
    { icon: FileText, title: "Resume", description: "ATS optimized" },
    { icon: Target, title: "Apply", description: "Target jobs" },
    { icon: Trophy, title: "Get Hired", description: "Success!" },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Progress Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">{roadmap.target_role}</h1>
              <p className="text-xs text-muted-foreground">{roadmap.total_duration} • {localMilestones.length} milestones</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{totalProgress}%</div>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
              <div className="w-24 md:w-32">
                <Progress value={totalProgress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Skills Section */}
        <section>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold mb-4 flex items-center gap-2"
          >
            <Star className="h-5 w-5 text-yellow-500" />
            Skills to Develop
          </motion.h2>
          <div className="flex flex-wrap gap-2">
            {roadmap.skills_to_learn.map((skill, i) => (
              <SkillTag key={i} skill={skill} index={i} />
            ))}
          </div>
        </section>

        {/* Horizontal Roadmap Section */}
        <section>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold mb-6 flex items-center gap-2"
          >
            <Map className="h-5 w-5 text-primary" />
            Your Career Journey
            <Badge variant="secondary" className="ml-2">
              {completedCount}/{localMilestones.length} completed
            </Badge>
          </motion.h2>

          {/* Scrollable Roadmap Container */}
          <div 
            ref={scrollContainerRef}
            className="relative overflow-x-auto pb-8 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Gradient Background Path */}
            <div className="absolute top-10 left-0 right-0 h-1 bg-gradient-to-r from-slate-700 via-primary/30 to-green-500/30 rounded-full" />

            {/* Milestones Container */}
            <div className="flex items-start pt-4 px-8 min-w-max">
              {/* Start Node */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center mr-4"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-medium mt-2 text-primary">Start</span>
              </motion.div>

              {/* Arrow from Start */}
              <div className="flex items-center mr-4 mt-4">
                <div className="w-8 h-0.5 bg-primary" />
                <ArrowRight className="h-4 w-4 text-primary -ml-1" />
              </div>

              {/* Milestone Nodes */}
              {localMilestones.map((milestone, index) => (
                <MilestoneNode
                  key={milestone.id}
                  milestone={milestone}
                  index={index}
                  isSelected={selectedMilestone?.id === milestone.id}
                  onClick={() => setSelectedMilestone(milestone)}
                  isLast={index === localMilestones.length - 1}
                />
              ))}

              {/* Arrow to End */}
              <div className="flex items-center ml-4 mt-4">
                <div className="w-8 h-0.5 bg-green-500" />
                <ArrowRight className="h-4 w-4 text-green-500 -ml-1" />
              </div>

              {/* End Node */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: localMilestones.length * 0.15 }}
                className="flex flex-col items-center ml-4"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-medium mt-2 text-green-400">Get Hired</span>
              </motion.div>
            </div>
          </div>

          {/* Scroll Hint */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
            <span>Scroll horizontally to explore</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </section>

        {/* Real World Practice */}
        {roadmap.real_world_practice && (
          <section>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-xl font-bold mb-4 flex items-center gap-2"
            >
              <Globe className="h-5 w-5 text-primary" />
              Real-World Practice
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PracticeCard
                icon={Github}
                title="Open Source"
                description={roadmap.real_world_practice.open_source_suggestion?.substring(0, 60) || "Contribute to projects"}
                gradient="bg-gradient-to-r from-slate-700 to-slate-800"
              />
              <PracticeCard
                icon={Briefcase}
                title="Portfolio"
                description={roadmap.real_world_practice.portfolio_requirement?.substring(0, 60) || "Build showcase projects"}
                gradient="bg-gradient-to-r from-purple-500 to-pink-500"
              />
              <PracticeCard
                icon={Code}
                title="GitHub Activity"
                description={roadmap.real_world_practice.github_requirement?.substring(0, 60) || "Regular contributions"}
                gradient="bg-gradient-to-r from-green-500 to-emerald-500"
              />
              <PracticeCard
                icon={FileText}
                title="Resume Ready"
                description={roadmap.real_world_practice.resume_readiness?.substring(0, 60) || "ATS optimized"}
                gradient="bg-gradient-to-r from-amber-500 to-orange-500"
              />
            </div>
          </section>
        )}

        {/* Interview Preparation */}
        {roadmap.interview_preparation && (
          <section>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-xl font-bold mb-4 flex items-center gap-2"
            >
              <Award className="h-5 w-5 text-yellow-500" />
              Interview Preparation
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* DSA */}
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Code className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="font-semibold">DSA Practice</h3>
                  </div>
                  <p className="text-2xl font-bold text-primary mb-2">
                    {roadmap.interview_preparation.dsa_practice?.problems_to_solve || 100}+
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">problems to solve</p>
                  <div className="flex flex-wrap gap-1">
                    {roadmap.interview_preparation.dsa_practice?.platforms?.map((p, i) => (
                      <Badge key={i} className="bg-blue-500/10 text-blue-400 text-xs">{p}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Design */}
              {roadmap.interview_preparation.system_design_basics?.needed && (
                <Card className="glass-card">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Layers className="h-5 w-5 text-purple-400" />
                      </div>
                      <h3 className="font-semibold">System Design</h3>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {roadmap.interview_preparation.system_design_basics.topics?.map((t, i) => (
                        <Badge key={i} className="bg-purple-500/10 text-purple-400 text-xs">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mock Interviews */}
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Users className="h-5 w-5 text-green-400" />
                    </div>
                    <h3 className="font-semibold">Mock Interviews</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {roadmap.interview_preparation.mock_interview?.frequency || "Weekly practice"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {roadmap.interview_preparation.mock_interview?.platforms?.map((p, i) => (
                      <Badge key={i} className="bg-green-500/10 text-green-400 text-xs">{p}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Deployment Flow */}
        {deploymentSteps.length > 0 && (
          <section>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-xl font-bold mb-6 flex items-center gap-2"
            >
              <Rocket className="h-5 w-5 text-green-400" />
              Deployment & Job Application
            </motion.h2>
            <div className="flex flex-col md:flex-row md:items-start justify-center gap-4 md:gap-2">
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

        {/* Resources */}
        <section>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-xl font-bold mb-4 flex items-center gap-2"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            Recommended Resources
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roadmap.resources.map((resource, i) => (
              <motion.a
                key={i}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="block"
              >
                <Card className="glass-card h-full overflow-hidden group">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      {resource.type === "course" && <BookOpen className="h-4 w-4 text-primary" />}
                      {resource.type === "project" && <Code className="h-4 w-4 text-primary" />}
                      {resource.type === "certification" && <Award className="h-4 w-4 text-primary" />}
                      {resource.type === "book" && <BookOpen className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">{resource.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </CardContent>
                </Card>
              </motion.a>
            ))}
          </div>
        </section>

        {/* Final Career Outcome */}
        {roadmap.final_career_outcome && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-card bg-gradient-to-r from-primary/10 via-purple-500/10 to-green-500/10 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </motion.div>
                  <h2 className="text-xl font-bold">Final Career Outcome</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> You'll Be Able To Build
                    </h3>
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
                    <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-1">
                      <Target className="h-4 w-4" /> You Can Apply For
                    </h3>
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
                  <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 inline-flex items-center gap-2">
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

      {/* Milestone Detail Modal */}
      <AnimatePresence>
        {selectedMilestone && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMilestone(null)}
              className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
            />
            
            {/* Card */}
            <MilestoneDetailCard
              milestone={selectedMilestone}
              onClose={() => setSelectedMilestone(null)}
              onTaskToggle={(taskId) => handleTaskToggle(selectedMilestone.id, taskId)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HorizontalRoadmap;
