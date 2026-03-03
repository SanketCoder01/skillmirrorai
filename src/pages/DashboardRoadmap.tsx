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

interface RoleOverview {
  what_this_role_does: string;
  companies_that_hire: string[];
}

interface FinalCareerOutcome {
  can_build: string[];
  can_apply_for: string[];
  interview_level: string;
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
}

interface DeploymentJobPhase {
  how_to_deploy: string;
  resume_tips: string[];
  job_application_strategy: string;
}

interface RoadmapData {
  target_role: string;
  current_level: string;
  experience_level: string;
  time_commitment?: string;
  total_duration: string;
  role_overview?: RoleOverview;
  final_career_outcome?: FinalCareerOutcome;
  milestones: Milestone[];
  real_world_practice?: RealWorldPractice;
  interview_preparation?: InterviewPreparation;
  deployment_job_phase?: DeploymentJobPhase;
  skills_to_learn: string[];
  resources: {
    title: string;
    url: string;
    type: "course" | "book" | "project" | "certification";
  }[];
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Session Expired", description: "Please sign in again", variant: "destructive" });
        setLoading(false);
        return;
      }

      console.log("Calling generate-roadmap function...");

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-roadmap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          targetRole: formData.targetRole,
          currentLevel: formData.currentLevel || "beginner",
          experienceLevel: formData.experienceLevel || "fresher",
          timeCommitment: formData.timeCommitment,
          userId: user?.id,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        console.error("Roadmap API error:", resp.status, errData);
        
        if (resp.status === 401) {
          toast({ title: "Session Expired", description: "Please sign in again", variant: "destructive" });
          return;
        }
        throw new Error(errData.error || `Server error (${resp.status})`);
      }

      const { roadmap: roadmapData } = await resp.json();
      setRoadmap(roadmapData);

      // Save to database
      try {
        await supabase.from("roadmaps").insert({
          user_id: user?.id,
          target_role: formData.targetRole,
          current_level: formData.currentLevel,
          experience_level: formData.experienceLevel,
          time_commitment: formData.timeCommitment,
          roadmap_data: roadmapData,
        });
      } catch (dbError) {
        console.error("Failed to save roadmap:", dbError);
        // Don't fail if DB save fails
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
