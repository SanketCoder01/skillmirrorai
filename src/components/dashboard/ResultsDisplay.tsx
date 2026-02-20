import { motion } from "framer-motion";
import { ScoreCircle } from "./ScoreCircle";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download, TrendingUp, AlertTriangle, Award, BookOpen, Lightbulb, Target, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { generateCareerReport } from "@/lib/pdf-generator";

interface ResultsData {
  profileSummary: string;
  coreSkills: string[];
  softSkills: string[];
  missingSkills: string[];
  matchScore: number;
  ATSScore: number;
  careerLevel: string;
  suggestedCareerFields: string[];
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  suggestedProjects: { title: string; description: string }[];
  certifications: string[];
  marketDemandLevel: string;
  estimatedSalaryRange: string;
  thirtyDayRoadmap: { week: number; tasks: string[] }[];
  resumeRewriteSuggestions: string[];
  jobSearchKeywords: string[];
  relatedJobTitles: { title: string; description: string }[];
  keyActions: string[];
  skillsToFocus: string[];
  bestCareerDirection: string;
  riskFactors: string[];
}

interface ResultsDisplayProps {
  results: ResultsData;
  targetRole?: string;
  userName?: string;
  userEmail?: string;
}

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, delay: i * 0.08 },
});

function getRankBadge(score: number) {
  if (score >= 90) return { label: "Elite", color: "bg-neon-cyan text-primary-foreground" };
  if (score >= 75) return { label: "Pro", color: "bg-neon-green text-primary-foreground" };
  if (score >= 50) return { label: "Rising", color: "bg-secondary text-secondary-foreground" };
  return { label: "Beginner", color: "bg-muted text-muted-foreground" };
}

export function ResultsDisplay({ results, targetRole, userName, userEmail }: ResultsDisplayProps) {
  const { profile } = useAuth();
  const r = results;
  const rank = getRankBadge(r.matchScore);
  const name = userName || profile?.display_name || "User";
  const email = userEmail || profile?.email || "";

  return (
    <div className="space-y-6">
      {/* Executive Score Cards */}
      <motion.div {...fadeUp(0)} className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <ScoreCircle score={r.matchScore} label="Match Score" color="hsl(var(--neon-cyan))" size={130} />
          <ScoreCircle score={r.ATSScore} label="ATS Score" color="hsl(var(--neon-purple))" size={130} />
          <div className="flex flex-col items-center gap-2">
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${rank.color}`}>{rank.label}</div>
            <span className="text-xs text-muted-foreground">Resume Rank</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Badge variant="outline" className="text-base px-4 py-1 neon-border">{r.careerLevel}</Badge>
            <span className="text-xs text-muted-foreground">Career Level</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Salary Insight</p>
            <p className="text-lg font-bold gradient-text">{r.estimatedSalaryRange}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Market Demand</p>
            <Badge className={r.marketDemandLevel === "High" ? "bg-neon-green text-primary-foreground" : r.marketDemandLevel === "Medium" ? "bg-secondary" : "bg-muted"}>
              {r.marketDemandLevel}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Profile Summary */}
      <motion.div {...fadeUp(1)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Profile Summary</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{r.profileSummary}</p>
      </motion.div>

      {/* Skills */}
      <motion.div {...fadeUp(2)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-4">Skills Analysis</h3>
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Technical Skills</p>
          <div className="flex flex-wrap gap-2">{r.coreSkills.map(s => <Badge key={s} className="bg-neon-green/20 text-neon-green border-neon-green/30">{s}</Badge>)}</div>
        </div>
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Soft Skills</p>
          <div className="flex flex-wrap gap-2">{r.softSkills.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Missing Skills</p>
          <div className="flex flex-wrap gap-2">{r.missingSkills.map(s => <Badge key={s} className="bg-accent/20 text-accent border-accent/30">{s}</Badge>)}</div>
        </div>
      </motion.div>

      {/* Career fields */}
      <motion.div {...fadeUp(3)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Suggested Career Fields</h3>
        <div className="flex flex-wrap gap-2">{r.suggestedCareerFields.map(f => <Badge key={f} variant="outline" className="neon-border">{f}</Badge>)}</div>
      </motion.div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div {...fadeUp(4)} className="glass-card p-6">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-neon-green" /> Strengths</h3>
          <ul className="space-y-2">{r.strengths.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-neon-green mt-0.5 shrink-0">✓</span><span>{s}</span></li>)}</ul>
        </motion.div>
        <motion.div {...fadeUp(5)} className="glass-card p-6">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-accent" /> Areas for Improvement</h3>
          <ul className="space-y-2">{r.weaknesses.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-accent mt-0.5 shrink-0">✗</span><span>{s}</span></li>)}</ul>
        </motion.div>
      </div>

      {/* Improvement suggestions */}
      <motion.div {...fadeUp(6)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-secondary" /> Improvement Suggestions</h3>
        <ul className="space-y-2">{r.improvementSuggestions.map((s, i) => <li key={i} className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">{s}</li>)}</ul>
      </motion.div>

      {/* Certifications */}
      <motion.div {...fadeUp(7)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Recommended Certifications</h3>
        <ul className="space-y-2">{r.certifications.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><Award className="h-3 w-3 text-primary mt-1 shrink-0" />{s}</li>)}</ul>
      </motion.div>

      {/* Projects */}
      <motion.div {...fadeUp(8)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Suggested Projects</h3>
        <div className="grid gap-3">{r.suggestedProjects.map((p, i) => (
          <div key={i} className="bg-muted/30 rounded-lg p-4">
            <p className="font-medium text-sm">{p.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
          </div>
        ))}</div>
      </motion.div>

      {/* 30-day roadmap */}
      <motion.div {...fadeUp(9)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-4">30-Day Career Roadmap</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {r.thirtyDayRoadmap.map((w) => (
            <div key={w.week} className="glass-card p-4 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-xl" />
              <p className="font-bold text-sm text-primary mb-3 mt-1">Week {w.week}</p>
              <ul className="space-y-2">{w.tasks.map((t, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-primary shrink-0">•</span><span>{t}</span></li>)}</ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Resume rewrite suggestions */}
      <motion.div {...fadeUp(10)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3">Resume Optimization Tips</h3>
        <ul className="space-y-2">{r.resumeRewriteSuggestions.map((s, i) => <li key={i} className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">{s}</li>)}</ul>
      </motion.div>

      {/* Job recommendations */}
      <motion.div {...fadeUp(11)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-4 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Live Job Opportunities</h3>
        <div className="grid gap-4">
          {r.relatedJobTitles.map((job, i) => (
            <div key={i} className="bg-muted/20 rounded-lg p-4">
              <p className="font-medium">{job.title}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">{job.description}</p>
              <div className="flex flex-wrap gap-2">
                <a href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title)}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="text-xs neon-border"><ExternalLink className="h-3 w-3 mr-1" /> LinkedIn</Button>
                </a>
                <a href={`https://www.indeed.com/jobs?q=${encodeURIComponent(job.title)}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="text-xs neon-border"><ExternalLink className="h-3 w-3 mr-1" /> Indeed</Button>
                </a>
                <a href={`https://www.naukri.com/${encodeURIComponent(job.title.replace(/\s+/g, "-"))}-jobs`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="text-xs neon-border"><ExternalLink className="h-3 w-3 mr-1" /> Naukri</Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Strategy summary */}
      <motion.div {...fadeUp(12)} className="glass-card p-6 neon-border">
        <h3 className="font-display text-lg font-bold mb-4 gradient-text">Your AI Career Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Key Actions This Month</p>
            <ul className="space-y-1">{r.keyActions.map((a, i) => <li key={i} className="text-sm flex gap-2"><span className="text-primary font-bold">{i + 1}.</span>{a}</li>)}</ul>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Skills to Focus On</p>
            <div className="flex flex-wrap gap-2">{r.skillsToFocus.map(s => <Badge key={s} className="bg-primary/20 text-primary">{s}</Badge>)}</div>
          </div>
        </div>
        <div className="bg-muted/20 rounded-lg p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Best Career Direction</p>
          <p className="text-sm font-medium">{r.bestCareerDirection}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Risk Factors</p>
          <ul className="space-y-1">{r.riskFactors.map((rf, i) => <li key={i} className="text-sm text-accent flex items-start gap-2"><AlertTriangle className="h-3 w-3 mt-1 shrink-0" />{rf}</li>)}</ul>
        </div>
      </motion.div>

      {/* PDF Export */}
      <motion.div {...fadeUp(13)} className="text-center">
        <Button onClick={() => generateCareerReport(r, name, email, targetRole || "")} size="lg" className="btn-glow bg-primary text-primary-foreground">
          <Download className="h-4 w-4 mr-2" /> Download Professional Career Report
        </Button>
      </motion.div>
    </div>
  );
}
