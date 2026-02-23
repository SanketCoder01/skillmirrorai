import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Map, Target, Clock, Sparkles, Loader2, CheckCircle, 
  Circle, ArrowRight, BookOpen, Code, Briefcase, Users,
  Trophy, Star, ChevronRight
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
        toast({ title: "Error", description: "Please sign in first", variant: "destructive" });
        return;
      }

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
        const err = await resp.json();
        throw new Error(err.error || "Generation failed");
      }

      const { roadmap: roadmapData } = await resp.json();
      setRoadmap(roadmapData);

      // Save to database
      await supabase.from("roadmaps").insert({
        user_id: user?.id,
        target_role: formData.targetRole,
        current_level: formData.currentLevel,
        experience_level: formData.experienceLevel,
        time_commitment: formData.timeCommitment,
        roadmap_data: roadmapData,
      });

      toast({
        title: "Roadmap Generated!",
        description: `Your ${formData.targetRole} roadmap is ready`,
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Generation Failed",
        description: e.message,
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
                  
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getMilestoneIcon(idx)}
                          <h4 className="font-medium">{milestone.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {milestone.duration}
                          </Badge>
                          {milestone.status === "completed" && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                      
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
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

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
