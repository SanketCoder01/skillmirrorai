import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Target, Briefcase, Calendar, TrendingUp, Award, 
  CheckCircle, AlertTriangle, XCircle, Zap, BarChart3, PieChart as PieChartIcon,
  Code, Database, Cloud, Wrench, Users, Linkedin, ExternalLink,
  Sparkles, ChevronRight, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// ====================================
// TYPES & INTERFACES
// ====================================

interface ResumeData {
  resumeScore: number;
  atsScore: number;
  totalSkills: number;
  experienceYears: number;
  skills: string[];
  skillCategories: {
    frontend: number;
    backend: number;
    database: number;
    cloud: number;
    tools: number;
    softSkills: number;
  };
  skillProficiency: Record<string, number>;
  experience: {
    internships: number;
    freelance: number;
    fullTime: number;
    academicProjects: number;
  };
  careerGrowth: { year: string; roles: number; projects: number }[];
  sectionCompleteness: {
    summary: number;
    skills: number;
    projects: number;
    certifications: number;
    achievements: number;
  };
  technologyUsage: Record<string, number>;
  aiInsights: {
    bestFitRole: string;
    bestFitScore: number;
    skillGaps: string[];
    strongAreas: string[];
  };
  jobMatch?: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
  };
}

interface ResumeAnalyticsDashboardProps {
  profile?: any;
}

// ====================================
// ANIMATED COUNTER HOOK
// ====================================

const useCounter = (end: number, duration: number = 1500, startOnView: boolean = true) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (!hasStarted) return;
    
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  useEffect(() => {
    if (!startOnView || !ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  return { count, ref };
};

// ====================================
// ANIMATED SUMMARY CARD
// ====================================

const SummaryCard = ({ 
  icon: Icon, 
  label, 
  value, 
  suffix = "", 
  color, 
  delay = 0,
  description 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  suffix?: string;
  color: string;
  delay?: number;
  description?: string;
}) => {
  const { count, ref } = useCounter(value, 1500 + delay);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="group"
    >
      <Card className="border border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 overflow-hidden relative">
        {/* Subtle gradient background on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
          style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
        />
        
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold" style={{ color }}>
                  {count}
                </span>
                <span className="text-lg font-medium text-muted-foreground">{suffix}</span>
              </div>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ====================================
// CIRCULAR PROGRESS INDICATOR
// ====================================

const CircularProgress = ({ 
  value, 
  label, 
  size = 80, 
  strokeWidth = 6,
  color = "hsl(var(--primary))",
  delay = 0 
}: { 
  value: number; 
  label: string; 
  size?: number;
  strokeWidth?: number;
  color?: string;
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
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: delay / 1000 }}
      className="flex flex-col items-center"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.2}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay: delay / 1000, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{animatedValue}%</span>
        </div>
      </div>
      <span className="mt-2 text-xs text-muted-foreground text-center">{label}</span>
    </motion.div>
  );
};

// ====================================
// HORIZONTAL BAR
// ====================================

const HorizontalBar = ({ 
  label, 
  value, 
  maxValue, 
  color,
  delay = 0 
}: { 
  label: string; 
  value: number; 
  maxValue: number;
  color: string;
  delay?: number;
}) => {
  const percentage = (value / maxValue) * 100;
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percentage), delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${animatedWidth}%` }}
          transition={{ duration: 0.8, delay: delay / 1000, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
};

// ====================================
// SKILL TAG
// ====================================

const SkillTag = ({ 
  skill, 
  type, 
  delay = 0 
}: { 
  skill: string; 
  type: 'matched' | 'missing' | 'strong' | 'gap';
  delay?: number;
}) => {
  const styles = {
    matched: "bg-green-500/10 text-green-600 border-green-500/30",
    missing: "bg-red-500/10 text-red-600 border-red-500/30",
    strong: "bg-green-500/10 text-green-600 border-green-500/30",
    gap: "bg-red-500/10 text-red-600 border-red-500/30",
  };

  const icons = {
    matched: CheckCircle,
    missing: XCircle,
    strong: CheckCircle,
    gap: AlertTriangle,
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: delay / 1000 }}
    >
      <Badge variant="outline" className={`${styles[type]} text-xs px-2 py-1`}>
        <Icon className="h-3 w-3 mr-1" />
        {skill}
      </Badge>
    </motion.div>
  );
};

// ====================================
// MAIN COMPONENT
// ====================================

const ResumeAnalyticsDashboard = ({ profile }: ResumeAnalyticsDashboardProps) => {
  const { user } = useAuth();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchResumeData();
    }
  }, [user?.id]);

  const fetchResumeData = async () => {
    try {
      // Fetch resume analysis data
      const { data: analysisData } = await supabase
        .from("analyses")
        .select("match_score, results_json, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analysisData?.results_json) {
        const results = analysisData.results_json as any;
        
        // Parse and structure the resume data
        const parsedData: ResumeData = {
          resumeScore: results.resumeScore || results.overallScore || analysisData.match_score || 75,
          atsScore: results.atsScore || results.ats_score || 82,
          totalSkills: results.skills?.length || Object.keys(results.skill_scores || {}).length || 12,
          experienceYears: results.experienceYears || results.yearsOfExperience || 2,
          skills: results.skills || [],
          skillCategories: results.skillCategories || {
            frontend: 35,
            backend: 25,
            database: 15,
            cloud: 10,
            tools: 10,
            softSkills: 5,
          },
          skillProficiency: results.skill_scores || results.skillProficiency || {
            "React": 9,
            "JavaScript": 8,
            "TypeScript": 7,
            "Node.js": 6,
            "Python": 5,
            "MongoDB": 6,
            "AWS": 4,
            "Git": 8,
          },
          experience: results.experience || {
            internships: 2,
            freelance: 1,
            fullTime: 1,
            academicProjects: 4,
          },
          careerGrowth: results.careerGrowth || [
            { year: "2021", roles: 1, projects: 2 },
            { year: "2022", roles: 2, projects: 4 },
            { year: "2023", roles: 2, projects: 6 },
            { year: "2024", roles: 3, projects: 8 },
          ],
          sectionCompleteness: results.sectionCompleteness || {
            summary: 85,
            skills: 90,
            projects: 75,
            certifications: 60,
            achievements: 40,
          },
          technologyUsage: results.technologyUsage || {
            "React": 4,
            "Node.js": 3,
            "MongoDB": 2,
            "AWS": 1,
            "Python": 2,
            "TypeScript": 3,
          },
          aiInsights: results.aiInsights || {
            bestFitRole: "Frontend Developer",
            bestFitScore: 85,
            skillGaps: ["GraphQL", "Docker", "CI/CD"],
            strongAreas: ["React", "JavaScript", "UI/UX"],
          },
          jobMatch: results.jobMatch || {
            score: 78,
            matchedSkills: ["React", "JavaScript", "Node.js", "MongoDB"],
            missingSkills: ["GraphQL", "Docker"],
          },
        };

        setResumeData(parsedData);
      } else {
        // Default data if no analysis exists
        setResumeData({
          resumeScore: 0,
          atsScore: 0,
          totalSkills: 0,
          experienceYears: 0,
          skills: [],
          skillCategories: { frontend: 0, backend: 0, database: 0, cloud: 0, tools: 0, softSkills: 0 },
          skillProficiency: {},
          experience: { internships: 0, freelance: 0, fullTime: 0, academicProjects: 0 },
          careerGrowth: [],
          sectionCompleteness: { summary: 0, skills: 0, projects: 0, certifications: 0, achievements: 0 },
          technologyUsage: {},
          aiInsights: { bestFitRole: "", bestFitScore: 0, skillGaps: [], strongAreas: [] },
          jobMatch: { score: 0, matchedSkills: [], missingSkills: [] },
        });
      }
    } catch (error) {
      console.error("Error fetching resume data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Chart colors
  const COLORS = {
    primary: "hsl(var(--primary))",
    frontend: "#3B82F6",
    backend: "#10B981",
    database: "#F59E0B",
    cloud: "#8B5CF6",
    tools: "#EC4899",
    softSkills: "#06B6D4",
  };

  const skillCategoryData = resumeData ? [
    { name: "Frontend", value: resumeData.skillCategories.frontend, color: COLORS.frontend },
    { name: "Backend", value: resumeData.skillCategories.backend, color: COLORS.backend },
    { name: "Database", value: resumeData.skillCategories.database, color: COLORS.database },
    { name: "Cloud", value: resumeData.skillCategories.cloud, color: COLORS.cloud },
    { name: "Tools", value: resumeData.skillCategories.tools, color: COLORS.tools },
    { name: "Soft Skills", value: resumeData.skillCategories.softSkills, color: COLORS.softSkills },
  ].filter(d => d.value > 0) : [];

  const skillProficiencyData = resumeData ? Object.entries(resumeData.skillProficiency)
    .map(([skill, score]) => ({ skill, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8) : [];

  const experienceBarData = resumeData ? [
    { name: "Internships", value: resumeData.experience.internships, color: "#3B82F6" },
    { name: "Freelance", value: resumeData.experience.freelance, color: "#10B981" },
    { name: "Full-time", value: resumeData.experience.fullTime, color: "#8B5CF6" },
    { name: "Projects", value: resumeData.experience.academicProjects, color: "#F59E0B" },
  ] : [];

  const techUsageData = resumeData ? Object.entries(resumeData.technologyUsage)
    .map(([tech, count]) => ({ tech, count }))
    .sort((a, b) => b.count - a.count) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  // Show empty state if no resume data
  if (!resumeData || resumeData.resumeScore === 0) {
    return (
      <div className="space-y-6 py-4">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">
              Welcome, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "User"}</span>!
            </h1>
            <p className="text-muted-foreground mt-1">Upload your resume to see analytics</p>
          </div>
        </div>

        <Card className="border border-dashed border-border/50 bg-card/30">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
            >
              <FileText className="h-10 w-10 text-primary" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">No Resume Data Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Upload and analyze your resume to see detailed insights about your skills, experience, and career fit.
            </p>
            <Button asChild>
              <a href="/dashboard/analysis">
                <Zap className="h-4 w-4 mr-2" />
                Analyze Your Resume
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold">
            Welcome back, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "User"}</span>!
          </h1>
          <p className="text-muted-foreground mt-1">Your Resume Analytics Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.skillmirror_id && (
            <Badge variant="outline" className="font-mono text-xs border-primary/30">
              ID: {profile.skillmirror_id}
            </Badge>
          )}
          {profile?.verification_status === "verified" && (
            <Badge className="bg-green-500/10 text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" /> Verified
            </Badge>
          )}
        </div>
      </motion.div>

      {/* ================================ */}
      {/* SECTION 1: TOP SUMMARY CARDS */}
      {/* ================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={Target}
          label="Resume Strength"
          value={resumeData.resumeScore}
          suffix="%"
          color="#3B82F6"
          delay={0}
          description="Overall quality score"
        />
        <SummaryCard
          icon={FileText}
          label="ATS Match Score"
          value={resumeData.atsScore}
          suffix="%"
          color="#10B981"
          delay={100}
          description="ATS compatibility"
        />
        <SummaryCard
          icon={Zap}
          label="Total Skills"
          value={resumeData.totalSkills}
          color="#8B5CF6"
          delay={200}
          description="Identified skills"
        />
        <SummaryCard
          icon={Briefcase}
          label="Experience"
          value={resumeData.experienceYears}
          suffix="+ yrs"
          color="#F59E0B"
          delay={300}
          description="Years of experience"
        />
      </div>

      {/* ================================ */}
      {/* SECTION 2: SKILLS ANALYSIS */}
      {/* ================================ */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Donut Chart - Skill Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border border-border/50 bg-card/50 backdrop-blur-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChartIcon className="h-4 w-4 text-primary" />
                Skill Category Distribution
              </CardTitle>
              <CardDescription>Breakdown by skill type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="w-40 h-40 sm:w-48 sm:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={skillCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        animationBegin={200}
                        animationDuration={1000}
                      >
                        {skillCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {skillCategoryData.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{item.value}%</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar Chart - Top Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border border-border/50 bg-card/50 backdrop-blur-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                Top Skills Proficiency
              </CardTitle>
              <CardDescription>Your strongest skills (0-10)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillProficiencyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis type="number" domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis 
                      type="category" 
                      dataKey="skill" 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} 
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Bar 
                      dataKey="score" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                      animationBegin={300}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ================================ */}
      {/* SECTION 3: EXPERIENCE ANALYSIS */}
      {/* ================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Experience Analysis
            </CardTitle>
            <CardDescription>Your career growth and experience breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Line Chart - Career Growth */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Career Growth Trend</h4>
                <div className="h-36 sm:h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={resumeData.careerGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="projects" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.2}
                        animationBegin={400}
                        animationDuration={800}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="roles" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.2}
                        animationBegin={500}
                        animationDuration={800}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2 justify-center">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Projects</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Roles</span>
                  </div>
                </div>
              </div>

              {/* Experience Bars */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Experience Breakdown</h4>
                <div className="space-y-4">
                  {experienceBarData.map((item, i) => (
                    <HorizontalBar
                      key={item.name}
                      label={item.name}
                      value={item.value}
                      maxValue={10}
                      color={item.color}
                      delay={400 + i * 100}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================ */}
      {/* SECTION 4: RESUME COMPLETENESS */}
      {/* ================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Resume Section Completeness
            </CardTitle>
            <CardDescription>How complete is each section of your resume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 py-4">
              <CircularProgress 
                value={resumeData.sectionCompleteness.summary} 
                label="Summary" 
                color="#3B82F6"
                delay={500}
              />
              <CircularProgress 
                value={resumeData.sectionCompleteness.skills} 
                label="Skills" 
                color="#10B981"
                delay={600}
              />
              <CircularProgress 
                value={resumeData.sectionCompleteness.projects} 
                label="Projects" 
                color="#8B5CF6"
                delay={700}
              />
              <CircularProgress 
                value={resumeData.sectionCompleteness.certifications} 
                label="Certifications" 
                color="#F59E0B"
                delay={800}
              />
              <CircularProgress 
                value={resumeData.sectionCompleteness.achievements} 
                label="Achievements" 
                color="#EC4899"
                delay={900}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================ */}
      {/* SECTION 5: TECHNOLOGY USAGE */}
      {/* ================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Code className="h-4 w-4 text-primary" />
              Technology Usage
            </CardTitle>
            <CardDescription>Technologies used across your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {techUsageData.slice(0, 6).map((item, i) => (
                  <HorizontalBar
                    key={item.tech}
                    label={item.tech}
                    value={item.count}
                    maxValue={Math.max(...techUsageData.map(d => d.count))}
                    color={`hsl(${220 + i * 30}, 70%, 50%)`}
                    delay={600 + i * 100}
                  />
                ))}
              </div>
              <div className="h-40 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={techUsageData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="tech" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      animationBegin={600}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================ */}
      {/* SECTION 6: AI CAREER INSIGHTS */}
      {/* ================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="border border-border/50 bg-gradient-to-br from-primary/5 to-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Career Insights
            </CardTitle>
            <CardDescription>Personalized recommendations based on your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Best Fit Role */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Best Fit Role</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{resumeData.aiInsights.bestFitRole}</h3>
                    <Badge className="bg-primary/10 text-primary">
                      {resumeData.aiInsights.bestFitScore}% match
                    </Badge>
                  </div>
                </div>

                {/* Strong Areas */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Strong Areas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.aiInsights.strongAreas.map((skill, i) => (
                      <SkillTag key={skill} skill={skill} type="strong" delay={700 + i * 50} />
                    ))}
                  </div>
                </div>

                {/* Skill Gaps */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Skills to Improve
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.aiInsights.skillGaps.map((skill, i) => (
                      <SkillTag key={skill} skill={skill} type="gap" delay={800 + i * 50} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Job Match */}
              {resumeData.jobMatch && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium">Job Match Analysis</p>
                    <Badge variant="outline" className="text-lg font-bold">
                      {resumeData.jobMatch.score}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Matched Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {resumeData.jobMatch.matchedSkills.map((skill, i) => (
                          <SkillTag key={skill} skill={skill} type="matched" delay={900 + i * 50} />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Missing Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {resumeData.jobMatch.missingSkills.map((skill, i) => (
                          <SkillTag key={skill} skill={skill} type="missing" delay={1000 + i * 50} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="outline" asChild>
          <a href="/dashboard/analysis">
            <FileText className="h-4 w-4 mr-2" />
            Re-analyze Resume
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard/ats">
            <Target className="h-4 w-4 mr-2" />
            Check ATS Score
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard/roadmap">
            <TrendingUp className="h-4 w-4 mr-2" />
            Career Roadmap
          </a>
        </Button>
      </div>
    </div>
  );
};

export default ResumeAnalyticsDashboard;
