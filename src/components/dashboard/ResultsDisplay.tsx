import { motion } from "framer-motion";
import { ScoreCircle } from "./ScoreCircle";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download, TrendingUp, AlertTriangle, Award, BookOpen, Lightbulb, Target, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { useAuth } from "@/contexts/AuthContext";

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

const anim = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.1 } });

function getRankBadge(score: number) {
  if (score >= 90) return { label: "Elite", color: "bg-neon-cyan text-primary-foreground" };
  if (score >= 75) return { label: "Pro", color: "bg-neon-green text-primary-foreground" };
  if (score >= 50) return { label: "Rising", color: "bg-secondary text-secondary-foreground" };
  return { label: "Beginner", color: "bg-muted text-muted-foreground" };
}

function generateProfessionalPDF(r: ResultsData, userName: string, userEmail: string, targetRole: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 0;

  const colors = {
    primary: [0, 180, 216] as [number, number, number],
    dark: [20, 25, 45] as [number, number, number],
    text: [55, 65, 81] as [number, number, number],
    lightBg: [243, 244, 246] as [number, number, number],
    green: [34, 197, 94] as [number, number, number],
    red: [239, 68, 68] as [number, number, number],
    purple: [139, 92, 246] as [number, number, number],
  };

  const checkPage = (needed: number) => {
    if (y + needed > 275) { doc.addPage(); y = 20; }
  };

  const drawSectionHeader = (title: string) => {
    checkPage(15);
    doc.setFillColor(...colors.primary);
    doc.rect(20, y, 4, 8, "F");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.dark);
    doc.text(title, 28, y + 6);
    y += 14;
  };

  const drawText = (text: string, size = 9, color = colors.text, bold = false, indent = 20) => {
    checkPage(8);
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, pageWidth - indent - 20);
    doc.text(lines, indent, y);
    y += lines.length * (size * 0.45) + 3;
  };

  const drawBullet = (text: string, bulletColor = colors.text) => {
    checkPage(8);
    doc.setFillColor(...bulletColor);
    doc.circle(24, y - 1, 1.2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    const lines = doc.splitTextToSize(text, pageWidth - 50);
    doc.text(lines, 28, y);
    y += lines.length * 4.5 + 2;
  };

  // === HEADER ===
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, pageWidth, 45, "F");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SkillMirror AI", 20, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 200, 220);
  doc.text("Professional Career Analysis Report", 20, 26);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 20, 34);
  doc.text(`www.skillmirror.ai`, pageWidth - 50, 34);
  y = 55;

  // === USER INFO ===
  doc.setFillColor(...colors.lightBg);
  doc.roundedRect(20, y, pageWidth - 40, 22, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.dark);
  doc.text(`Candidate: ${userName}`, 26, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.text);
  doc.text(`Email: ${userEmail}`, 26, y + 15);
  doc.text(`Target Role: ${targetRole || "General Analysis"}`, pageWidth / 2, y + 8);
  y += 30;

  // === SCORE SECTION ===
  doc.setFillColor(...colors.lightBg);
  doc.roundedRect(20, y, (pageWidth - 50) / 3, 30, 3, 3, "F");
  doc.roundedRect(20 + (pageWidth - 50) / 3 + 5, y, (pageWidth - 50) / 3, 30, 3, 3, "F");
  doc.roundedRect(20 + 2 * ((pageWidth - 50) / 3 + 5), y, (pageWidth - 50) / 3, 30, 3, 3, "F");

  // Match score
  const boxW = (pageWidth - 50) / 3;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text(`${r.matchScore}%`, 20 + boxW / 2, y + 14, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(...colors.text);
  doc.text("Match Score", 20 + boxW / 2, y + 22, { align: "center" });

  // ATS score
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.purple);
  doc.text(`${r.ATSScore}%`, 20 + boxW + 5 + boxW / 2, y + 14, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(...colors.text);
  doc.text("ATS Score", 20 + boxW + 5 + boxW / 2, y + 22, { align: "center" });

  // Career level
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.dark);
  doc.text(r.careerLevel, 20 + 2 * (boxW + 5) + boxW / 2, y + 14, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(...colors.text);
  doc.text("Career Level", 20 + 2 * (boxW + 5) + boxW / 2, y + 22, { align: "center" });

  y += 38;

  // Market + Salary
  drawText(`Estimated Salary: ${r.estimatedSalaryRange}  |  Market Demand: ${r.marketDemandLevel}`, 9, colors.text, true);
  y += 4;

  // === PROFILE SUMMARY ===
  drawSectionHeader("Profile Summary");
  drawText(r.profileSummary);
  y += 4;

  // === CORE SKILLS ===
  drawSectionHeader("Core Skills");
  drawText(r.coreSkills.join("  |  "), 9, colors.primary, true);
  y += 2;

  // === SOFT SKILLS ===
  if (r.softSkills?.length) {
    drawSectionHeader("Soft Skills");
    drawText(r.softSkills.join("  |  "));
    y += 2;
  }

  // === MISSING SKILLS ===
  drawSectionHeader("Skills Gap Analysis");
  r.missingSkills.forEach(s => drawBullet(s, colors.red));
  y += 4;

  // === STRENGTHS ===
  drawSectionHeader("Strengths");
  r.strengths.forEach(s => drawBullet(s, colors.green));
  y += 4;

  // === WEAKNESSES ===
  drawSectionHeader("Areas for Improvement");
  r.weaknesses.forEach(s => drawBullet(s, colors.red));
  y += 4;

  // === IMPROVEMENT SUGGESTIONS ===
  drawSectionHeader("Improvement Suggestions");
  r.improvementSuggestions.forEach(s => drawBullet(s, colors.primary));
  y += 4;

  // === CERTIFICATIONS ===
  if (r.certifications?.length) {
    drawSectionHeader("Recommended Certifications");
    r.certifications.forEach(s => drawBullet(s, colors.purple));
    y += 4;
  }

  // === SUGGESTED PROJECTS ===
  if (r.suggestedProjects?.length) {
    drawSectionHeader("Suggested Projects");
    r.suggestedProjects.forEach(p => {
      checkPage(12);
      drawText(p.title, 10, colors.dark, true, 28);
      drawText(p.description, 9, colors.text, false, 28);
    });
    y += 4;
  }

  // === 30 DAY ROADMAP ===
  drawSectionHeader("30-Day Career Roadmap");
  r.thirtyDayRoadmap.forEach(w => {
    checkPage(15);
    drawText(`Week ${w.week}`, 10, colors.primary, true, 24);
    w.tasks.forEach(t => drawBullet(t, colors.primary));
    y += 2;
  });
  y += 4;

  // === KEY ACTIONS ===
  drawSectionHeader("Key Actions This Month");
  r.keyActions.forEach((a, i) => {
    checkPage(8);
    drawText(`${i + 1}. ${a}`, 9, colors.dark, true, 24);
  });
  y += 4;

  // === CAREER DIRECTION ===
  drawSectionHeader("Best Career Direction");
  drawText(r.bestCareerDirection, 10, colors.dark, true);
  y += 4;

  // === SKILLS TO FOCUS ===
  if (r.skillsToFocus?.length) {
    drawSectionHeader("Skills to Focus On");
    drawText(r.skillsToFocus.join("  |  "), 9, colors.primary, true);
    y += 4;
  }

  // === RISK FACTORS ===
  if (r.riskFactors?.length) {
    drawSectionHeader("Risk Factors");
    r.riskFactors.forEach(s => drawBullet(s, colors.red));
    y += 4;
  }

  // === RESUME REWRITE SUGGESTIONS ===
  if (r.resumeRewriteSuggestions?.length) {
    drawSectionHeader("Resume Optimization Tips");
    r.resumeRewriteSuggestions.forEach(s => drawBullet(s, colors.primary));
    y += 4;
  }

  // === JOB SEARCH KEYWORDS ===
  if (r.jobSearchKeywords?.length) {
    drawSectionHeader("Job Search Keywords");
    drawText(r.jobSearchKeywords.join("  |  "));
    y += 4;
  }

  // === FOOTER on each page ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...colors.dark);
    doc.rect(0, 285, pageWidth, 12, "F");
    doc.setFontSize(7);
    doc.setTextColor(180, 200, 220);
    doc.text("SkillMirror AI  |  Powered by Advanced AI Analysis  |  www.skillmirror.ai", 20, 291);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 35, 291);
  }

  doc.save(`SkillMirror-Report-${targetRole || "Career"}.pdf`);
}

export function ResultsDisplay({ results, targetRole, userName, userEmail }: ResultsDisplayProps) {
  const { profile } = useAuth();
  const r = results;
  const rank = getRankBadge(r.matchScore);
  const name = userName || profile?.display_name || "User";
  const email = userEmail || profile?.email || "";

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
        <ul className="space-y-2">{r.improvementSuggestions.map((s, i) => <li key={i} className="text-sm text-muted-foreground">{s}</li>)}</ul>
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
              <ul className="space-y-1">{w.tasks.map((t, i) => <li key={i} className="text-xs text-muted-foreground">{t}</li>)}</ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Resume rewrite suggestions */}
      <motion.div {...anim(10)} className="glass-card p-6">
        <h3 className="font-display font-bold mb-3">Resume Optimization Tips</h3>
        <ul className="space-y-2">{r.resumeRewriteSuggestions.map((s, i) => <li key={i} className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">{s}</li>)}</ul>
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
        <Button onClick={() => generateProfessionalPDF(r, name, email, targetRole || "")} size="lg" className="btn-glow bg-primary text-primary-foreground">
          <Download className="h-4 w-4 mr-2" /> Generate Professional Career Report
        </Button>
      </motion.div>
    </div>
  );
}
