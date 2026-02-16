import { motion } from "framer-motion";
import { ScoreCircle } from "./ScoreCircle";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download, TrendingUp, AlertTriangle, Award, BookOpen, Lightbulb, Target, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

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

const anim = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.1 } });

function getRankBadge(score: number) {
  if (score >= 90) return { label: "Elite", color: "bg-neon-cyan text-primary-foreground" };
  if (score >= 75) return { label: "Pro", color: "bg-neon-green text-primary-foreground" };
  if (score >= 50) return { label: "Rising", color: "bg-secondary text-secondary-foreground" };
  return { label: "Beginner", color: "bg-muted text-muted-foreground" };
}

function generatePDF(r: ResultsData) {
  const doc = new jsPDF();
  let y = 20;
  const addLine = (text: string, size = 10, bold = false) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(size);
    if (bold) doc.setFont("helvetica", "bold"); else doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, y);
    y += lines.length * (size * 0.5) + 4;
  };

  addLine("SkillMirror AI - Career Analysis Report", 18, true);
  addLine(`Generated: ${new Date().toLocaleDateString()}`, 9);
  y += 5;
  addLine("Profile Summary", 14, true);
  addLine(r.profileSummary);
  y += 3;
  addLine(`Match Score: ${r.matchScore}% | ATS Score: ${r.ATSScore}% | Level: ${r.careerLevel}`, 11, true);
  addLine(`Salary Range: ${r.estimatedSalaryRange} | Market Demand: ${r.marketDemandLevel}`);
  y += 3;
  addLine("Core Skills", 12, true);
  addLine(r.coreSkills.join(", "));
  addLine("Missing Skills", 12, true);
  addLine(r.missingSkills.join(", "));
  addLine("Strengths", 12, true);
  r.strengths.forEach(s => addLine(`• ${s}`));
  addLine("Weaknesses", 12, true);
  r.weaknesses.forEach(s => addLine(`• ${s}`));
  addLine("Suggested Career Fields", 12, true);
  addLine(r.suggestedCareerFields.join(", "));
  addLine("Certifications", 12, true);
  r.certifications.forEach(s => addLine(`• ${s}`));
  addLine("30-Day Roadmap", 12, true);
  r.thirtyDayRoadmap.forEach(w => { addLine(`Week ${w.week}:`, 10, true); w.tasks.forEach(t => addLine(`  • ${t}`)); });
  addLine("Key Actions", 12, true);
  r.keyActions.forEach(s => addLine(`• ${s}`));
  addLine(`Best Career Direction: ${r.bestCareerDirection}`, 11, true);

  doc.save("SkillMirror-Career-Report.pdf");
}

export function ResultsDisplay({ results }: { results: ResultsData }) {
  const r = results;
  const rank = getRankBadge(r.matchScore);

  return (
    <div className="space-y-6">
      {/* Score cards */}
      <motion.div {...anim(0)} className="glass-card p-6">
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
      <motion.div {...anim(1)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Profile Summary</h3>
        <p className="text-sm text-muted-foreground">{r.profileSummary}</p>
      </motion.div>

      {/* Skills */}
      <motion.div {...anim(2)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3">Skills Analysis</h3>
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">Core Skills</p>
          <div className="flex flex-wrap gap-2">{r.coreSkills.map(s => <Badge key={s} className="bg-neon-green/20 text-neon-green border-neon-green/30">{s}</Badge>)}</div>
        </div>
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">Soft Skills</p>
          <div className="flex flex-wrap gap-2">{r.softSkills.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Missing Skills</p>
          <div className="flex flex-wrap gap-2">{r.missingSkills.map(s => <Badge key={s} className="bg-accent/20 text-accent border-accent/30">{s}</Badge>)}</div>
        </div>
      </motion.div>

      {/* Career fields */}
      <motion.div {...anim(3)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Suggested Career Fields</h3>
        <div className="flex flex-wrap gap-2">{r.suggestedCareerFields.map(f => <Badge key={f} variant="outline" className="neon-border">{f}</Badge>)}</div>
      </motion.div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div {...anim(4)} className="glass-card p-6">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-neon-green" /> Strengths</h3>
          <ul className="space-y-2">{r.strengths.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-neon-green mt-1">✓</span>{s}</li>)}</ul>
        </motion.div>
        <motion.div {...anim(5)} className="glass-card p-6">
          <h3 className="font-display font-bold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-accent" /> Weaknesses</h3>
          <ul className="space-y-2">{r.weaknesses.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-accent mt-1">✗</span>{s}</li>)}</ul>
        </motion.div>
      </div>

      {/* Improvement suggestions */}
      <motion.div {...anim(6)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-secondary" /> Improvement Suggestions</h3>
        <ul className="space-y-2">{r.improvementSuggestions.map((s, i) => <li key={i} className="text-sm text-muted-foreground">• {s}</li>)}</ul>
      </motion.div>

      {/* Certifications */}
      <motion.div {...anim(7)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Recommended Certifications</h3>
        <ul className="space-y-2">{r.certifications.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><Award className="h-3 w-3 text-primary mt-1 shrink-0" />{s}</li>)}</ul>
      </motion.div>

      {/* Projects */}
      <motion.div {...anim(8)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Suggested Projects</h3>
        <div className="grid gap-3">{r.suggestedProjects.map((p, i) => (
          <div key={i} className="bg-muted/30 rounded-lg p-3">
            <p className="font-medium text-sm">{p.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
          </div>
        ))}</div>
      </motion.div>

      {/* 30-day roadmap */}
      <motion.div {...anim(9)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-4">30-Day Roadmap</h3>
        <div className="space-y-4">
          {r.thirtyDayRoadmap.map((w) => (
            <div key={w.week} className="relative pl-6 border-l-2 border-primary/30">
              <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-primary" />
              <p className="font-bold text-sm text-primary mb-1">Week {w.week}</p>
              <ul className="space-y-1">{w.tasks.map((t, i) => <li key={i} className="text-xs text-muted-foreground">• {t}</li>)}</ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Resume rewrite suggestions */}
      <motion.div {...anim(10)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3">AI Resume Rewrite Suggestions</h3>
        <ul className="space-y-2">{r.resumeRewriteSuggestions.map((s, i) => <li key={i} className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">💡 {s}</li>)}</ul>
      </motion.div>

      {/* Job recommendations */}
      <motion.div {...anim(11)} className="glass-card p-6">
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
      <motion.div {...anim(12)} className="glass-card p-6 neon-border">
        <h3 className="font-display text-lg font-bold mb-4 gradient-text">Your AI Career Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">3 Key Actions This Month</p>
            <ul className="space-y-1">{r.keyActions.map((a, i) => <li key={i} className="text-sm flex gap-2"><span className="text-primary font-bold">{i + 1}.</span>{a}</li>)}</ul>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Skills to Focus On</p>
            <div className="flex flex-wrap gap-2">{r.skillsToFocus.map(s => <Badge key={s} className="bg-primary/20 text-primary">{s}</Badge>)}</div>
          </div>
        </div>
        <div className="bg-muted/20 rounded-lg p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Best Career Direction</p>
          <p className="text-sm font-medium">{r.bestCareerDirection}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Risk Factors to Avoid</p>
          <ul className="space-y-1">{r.riskFactors.map((rf, i) => <li key={i} className="text-sm text-accent flex items-start gap-2"><AlertTriangle className="h-3 w-3 mt-1 shrink-0" />{rf}</li>)}</ul>
        </div>
      </motion.div>

      {/* PDF Export */}
      <motion.div {...anim(13)} className="text-center">
        <Button onClick={() => generatePDF(r)} size="lg" className="btn-glow bg-primary text-primary-foreground">
          <Download className="h-4 w-4 mr-2" /> Generate Professional Career Report
        </Button>
      </motion.div>
    </div>
  );
}
