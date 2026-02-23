import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnalysisCard } from "@/components/dashboard/AnalysisCard";
import { ResultsDisplay } from "@/components/dashboard/ResultsDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { Sparkles, TrendingUp, Award, Shield, Zap, Target, FileText, CheckCircle, AlertCircle, Download, ChevronRight, Trophy, BookOpen, BarChart3 } from "lucide-react";
import { Routes, Route } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import DashboardHistory from "./DashboardHistory";
import DashboardReports from "./DashboardReports";
import DashboardSettings from "./DashboardSettings";
import DashboardATS from "./DashboardATS";
import DashboardRewriter from "./DashboardRewriter";
import DashboardVerifier from "./DashboardVerifier";
import DashboardSkillTest from "./DashboardSkillTest";
import DashboardRoadmap from "./DashboardRoadmap";
import DashboardCertificate from "./DashboardCertificate";
import StudentInbox from "./StudentInbox";
import StudentProfile from "./StudentProfile";

// Types
interface UserData {
  profile: {
    skillmirror_id: string | null;
    full_name: string | null;
    university: string | null;
    course: string | null;
    verification_status: string | null;
    candidate_score: number | null;
    risk_score: number | null;
    skill_authenticity_score: number | null;
  } | null;
  resumeAnalysis: {
    match_score: number;
    ats_score: number;
    skills: string[];
    skill_scores: Record<string, number>;
  } | null;
  skillTest: {
    score: number;
    status: string;
    warnings: number;
    tab_switches: number;
    skills_verified: string[];
    completed_at: string | null;
  } | null;
  roadmap: {
    progress: number;
    milestones: any[];
  } | null;
  certificate: {
    certificate_number: string;
    issued_at: string;
  } | null;
}

// Animated Circular Progress Component
const AnimatedCircle = ({ 
  value, 
  size = 140, 
  strokeWidth = 10, 
  color = "hsl(var(--primary))",
  label,
  delay = 0 
}: { 
  value: number; 
  size?: number; 
  strokeWidth?: number; 
  color?: string;
  label: string;
  delay?: number;
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={radius} stroke="hsl(var(--muted))" strokeWidth={strokeWidth} fill="none" />
          <motion.circle
            cx={size/2} cy={size/2} r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, delay: delay/1000, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{animatedValue}%</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
};

// Empty State Card
const EmptyStateCard = ({ title, description, icon: Icon, actionLabel, actionPath }: { title: string; description: string; icon: any; actionLabel: string; actionPath: string }) => (
  <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      <Button asChild>
        <a href={actionPath}>
          {actionLabel}
          <ChevronRight className="ml-1 h-4 w-4" />
        </a>
      </Button>
    </CardContent>
  </Card>
);

// Section 1: Intelligence Summary
const IntelligenceSummary = ({ data }: { data: UserData }) => {
  if (!data.resumeAnalysis && !data.skillTest) {
    return (
      <EmptyStateCard
        title="No Analysis Data Yet"
        description="Upload and verify your resume to see your intelligence scores and skill metrics."
        icon={BarChart3}
        actionLabel="Verify Resume"
        actionPath="/dashboard/verifier"
      />
    );
  }

  const atsScore = data.resumeAnalysis?.ats_score || 0;
  const testScore = data.skillTest?.score || 0;
  const authenticity = data.profile?.skill_authenticity_score || 0;
  const candidateScore = Math.round((atsScore * 0.3) + (testScore * 0.4) + (authenticity * 0.2) + (50 * 0.1));

  return (
    <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Overall Intelligence Summary
        </CardTitle>
        <CardDescription>Your comprehensive skill intelligence metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <AnimatedCircle value={candidateScore} color="hsl(var(--primary))" label="Candidate Score" delay={0} />
          <AnimatedCircle value={atsScore} color="#059669" label="ATS Match Score" delay={200} />
          {data.skillTest && (
            <>
              <AnimatedCircle value={authenticity} color="#7C3AED" label="Skill Authenticity" delay={400} />
              <div className="flex flex-col items-center justify-center">
                <div className="w-full max-w-[140px]">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Growth Potential</span>
                    <span className="font-semibold">50%</span>
                  </div>
                  <Progress value={50} className="h-3" />
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Section 2: Skill Analysis Visualization
const SkillAnalysisVisualization = ({ data }: { data: UserData }) => {
  if (!data.resumeAnalysis?.skill_scores || Object.keys(data.resumeAnalysis.skill_scores).length === 0) {
    return (
      <EmptyStateCard
        title="No Skill Data Available"
        description="Complete a resume analysis to visualize your skill distribution and scores."
        icon={Target}
        actionLabel="Analyze Resume"
        actionPath="/dashboard/ats"
      />
    );
  }

  const skillScores = data.resumeAnalysis.skill_scores;
  const barData = Object.entries(skillScores).map(([skill, score]) => ({
    skill: skill.length > 12 ? skill.substring(0, 12) + "..." : skill,
    score,
    fill: score >= 80 ? "#059669" : score >= 50 ? "#EAB308" : "#DC2626"
  })).sort((a, b) => a.score - b.score);

  const radarData = [
    { subject: "Technical", value: skillScores["Technical"] || skillScores["Programming"] || 0, fullMark: 100 },
    { subject: "Logical", value: skillScores["Logical"] || 0, fullMark: 100 },
    { subject: "Analytical", value: skillScores["Analytical"] || 0, fullMark: 100 },
    { subject: "Communication", value: skillScores["Communication"] || 0, fullMark: 100 },
    { subject: "Problem Solving", value: skillScores["Problem Solving"] || 0, fullMark: 100 },
  ];

  return (
    <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Skill Analysis Visualization
        </CardTitle>
        <CardDescription>Extracted skills from your resume analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-4">Skill Scores</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis type="category" dataKey="skill" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4">Skill Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Radar name="Skills" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Section 4: Risk & Authenticity Analysis (only if test completed)
const RiskAuthenticityAnalysis = ({ data }: { data: UserData }) => {
  if (!data.skillTest) return null;

  const riskScore = data.profile?.risk_score || 15;
  const authenticity = data.profile?.skill_authenticity_score || 85;

  const riskData = [
    { name: "Safe", value: Math.max(100 - riskScore - 15, 0), color: "#059669" },
    { name: "Moderate", value: Math.min(riskScore, 15), color: "#EAB308" },
    { name: "High Risk", value: Math.max(riskScore - 15, 0), color: "#DC2626" },
  ].filter(d => d.value > 0);

  const growthData = [
    { month: "Month 1", value: Math.max(authenticity - 20, 10) },
    { month: "Month 2", value: Math.max(authenticity - 15, 25) },
    { month: "Month 3", value: Math.max(authenticity - 10, 40) },
    { month: "Month 4", value: Math.max(authenticity - 5, 55) },
    { month: "Month 5", value: authenticity },
  ];

  return (
    <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Risk & Authenticity Analysis
        </CardTitle>
        <CardDescription>Based on skill verification test performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-4">Risk Distribution</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4">Growth Potential Trend</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Section 5: Roadmap Progress (only if roadmap exists)
const RoadmapProgress = ({ data }: { data: UserData }) => {
  if (!data.roadmap) return null;

  const milestones = [
    { icon: Sparkles, label: "Start", status: "completed" },
    { icon: BookOpen, label: "Learn Basics", status: "completed" },
    { icon: Target, label: "Build Projects", status: "current" },
    { icon: Zap, label: "Advanced", status: "pending" },
    { icon: Award, label: "Interview Ready", status: "pending" },
    { icon: CheckCircle, label: "Finish", status: "pending" },
  ];

  return (
    <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Roadmap Progress
        </CardTitle>
        <CardDescription>Your career development journey</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute top-6 left-8 right-8 h-1 bg-muted rounded-full">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${data.roadmap.progress}%` }} />
          </div>
          <div className="relative flex justify-between">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              const isCompleted = milestone.status === "completed";
              const isCurrent = milestone.status === "current";
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all ${isCompleted ? "bg-primary text-primary-foreground" : isCurrent ? "bg-primary/20 text-primary ring-2 ring-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center ${isCompleted ? "text-foreground" : isCurrent ? "text-primary" : "text-muted-foreground"}`}>{milestone.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Progress</span>
            <span className="text-sm font-semibold">{Math.round(data.roadmap.progress)}%</span>
          </div>
          <Progress value={data.roadmap.progress} className="mt-2 h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

// Section 6: Verification Status (only if test completed)
const VerificationStatus = ({ data }: { data: UserData }) => {
  if (!data.skillTest) return null;

  const isVerified = data.skillTest.score >= 75;

  if (isVerified) {
    return (
      <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-500" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-green-500 text-white">Verified Candidate</Badge>
                <span className="text-sm text-muted-foreground">Score: {data.skillTest.score}%</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Your resume is globally verified and visible to recruiters.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="/dashboard/certificate"><FileText className="h-4 w-4 mr-1" />View Certificate</a>
                </Button>
                <Button size="sm"><Download className="h-4 w-4 mr-1" />Download Badge</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Verification Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <Trophy className="h-10 w-10 text-yellow-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">Score Below Threshold</Badge>
              <span className="text-sm text-muted-foreground">Score: {data.skillTest.score}% (Need 75%+)</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Improve your score to get globally verified and visible to recruiters.</p>
            <Button size="sm"><ChevronRight className="h-4 w-4 mr-1" />Retake Test</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Actions Section
const QuickActions = () => {
  const actions = [
    { icon: Shield, label: "Verify Resume", description: "Upload & verify", path: "/dashboard/verifier", color: "#2563EB" },
    { icon: BarChart3, label: "ATS Score", description: "Analyze resume", path: "/dashboard/ats", color: "#059669" },
    { icon: FileText, label: "Optimize", description: "Improve resume", path: "/dashboard/rewriter", color: "#7C3AED" },
    { icon: Trophy, label: "Skill Test", description: "Verify skills", path: "/dashboard/skill-test", color: "#EAB308" },
    { icon: TrendingUp, label: "Roadmap", description: "Career path", path: "/dashboard/roadmap", color: "#DC2626" },
    { icon: Award, label: "Certificates", description: "View all", path: "/dashboard/certificate", color: "#0891B2" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.a
            key={index}
            href={action.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <Card className="border border-border/50 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all cursor-pointer h-full">
              <CardContent className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ backgroundColor: `${action.color}20` }}>
                  <Icon className="h-6 w-6" style={{ color: action.color }} />
                </div>
                <h3 className="text-sm font-semibold mb-1">{action.label}</h3>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          </motion.a>
        );
      })}
    </div>
  );
};

// Main Dashboard Overview Component
const DashboardOverview = () => {
  const { user, profile } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    profile: null,
    resumeAnalysis: null,
    skillTest: null,
    roadmap: null,
    certificate: null,
  });

  useEffect(() => {
    if (user?.id) fetchAllData();
  }, [user?.id]);

  useEffect(() => {
    if (profile) setUserData(prev => ({ ...prev, profile: profile as any }));
  }, [profile]);

  const fetchAllData = async () => {
    try {
      const [analysesRes, testsRes, roadmapsRes, certificatesRes] = await Promise.all([
        supabase.from("analyses").select("match_score, results_json").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("skill_tests").select("score, status, warnings, tab_switches, skills_verified, completed_at").eq("user_id", user!.id).eq("status", "completed").order("completed_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("roadmaps").select("roadmap_data").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("certificates").select("certificate_number, issued_at").eq("user_id", user!.id).limit(1).maybeSingle(),
      ]);

      const latestAnalysis = analysesRes.data;
      const latestTest = testsRes.data;
      const latestRoadmap = roadmapsRes.data;

      setUserData(prev => ({
        ...prev,
        profile: profile as any,
        resumeAnalysis: latestAnalysis ? {
          match_score: latestAnalysis.match_score || 0,
          ats_score: (latestAnalysis.results_json as any)?.ats_score || latestAnalysis.match_score || 0,
          skills: (latestAnalysis.results_json as any)?.skills || [],
          skill_scores: (latestAnalysis.results_json as any)?.skill_scores || {},
        } : null,
        skillTest: latestTest ? {
          score: latestTest.score || 0,
          status: latestTest.status,
          warnings: latestTest.warnings || 0,
          tab_switches: latestTest.tab_switches || 0,
          skills_verified: (latestTest.skills_verified as string[]) || [],
          completed_at: latestTest.completed_at,
        } : null,
        roadmap: latestRoadmap?.roadmap_data ? {
          progress: ((latestRoadmap.roadmap_data as any).milestones?.filter((m: any) => m.status === "completed").length / (latestRoadmap.roadmap_data as any).milestones?.length) * 100 || 0,
          milestones: (latestRoadmap.roadmap_data as any).milestones || [],
        } : null,
        certificate: certificatesRes.data as any,
      }));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Welcome back, {profile?.full_name?.split(" ")[0] || "User"}!</h1>
          <p className="text-muted-foreground mt-1">Your SkillMirror Intelligence Dashboard</p>
        </div>
        {profile?.skillmirror_id && (
          <Badge variant="outline" className="text-sm font-mono px-3 py-1">
            ID: {profile.skillmirror_id}
          </Badge>
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Section 1: Intelligence Summary */}
      <IntelligenceSummary data={userData} />

      {/* Section 2: Skill Analysis */}
      <SkillAnalysisVisualization data={userData} />

      {/* Section 4: Risk & Authenticity - Only if test completed */}
      <RiskAuthenticityAnalysis data={userData} />

      {/* Section 5: Roadmap Progress - Only if roadmap exists */}
      <RoadmapProgress data={userData} />

      {/* Section 6: Verification Status - Only if test completed */}
      <VerificationStatus data={userData} />
    </div>
  );
};

// Resume Analysis Page (moved to /dashboard/analysis)
const ResumeAnalysisPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async (data: { resumeText: string; jobDescription: string; targetRole: string; location: string }) => {
    setLoading(true);
    setResults(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Please sign in first", variant: "destructive" });
        return;
      }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Analysis failed");
      }

      const { results: r } = await resp.json();
      setResults(r);
      toast({ title: "Analysis Complete!", description: `Match Score: ${r.matchScore}%` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnalysisCard onAnalyze={handleAnalyze} loading={loading} />
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                AI is deeply analyzing your resume...
              </motion.p>
              <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {results && (
        <div className="mt-6">
          <ResultsDisplay results={results} />
        </div>
      )}
    </>
  );
};

const Dashboard = () => {
  // Auto-logout after 5 minutes of inactivity
  useInactivityLogout(5, true);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
            <Routes>
              <Route index element={<DashboardOverview />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="inbox" element={<StudentInbox />} />
              <Route path="analysis" element={<ResumeAnalysisPage />} />
              <Route path="verifier" element={<DashboardVerifier />} />
              <Route path="skill-test" element={<DashboardSkillTest />} />
              <Route path="roadmap" element={<DashboardRoadmap />} />
              <Route path="certificate" element={<DashboardCertificate />} />
              <Route path="ats" element={<DashboardATS />} />
              <Route path="rewriter" element={<DashboardRewriter />} />
              <Route path="history" element={<DashboardHistory />} />
              <Route path="reports" element={<DashboardReports />} />
              <Route path="settings" element={<DashboardSettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
