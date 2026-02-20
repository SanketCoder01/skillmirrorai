import jsPDF from "jspdf";

// ── Shared PDF utilities for all report types ──

const COLORS = {
  primary: [0, 180, 216] as [number, number, number],
  dark: [20, 25, 45] as [number, number, number],
  text: [55, 65, 81] as [number, number, number],
  lightBg: [243, 244, 246] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  purple: [139, 92, 246] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  muted: [180, 200, 220] as [number, number, number],
};

function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[#*_~`>]/g, "")
    .replace(/^-\s/gm, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[^\x20-\x7E\n\u2022\u2013\u2014\u2018\u2019\u201C\u201D]/g, "")
    .trim();
}

class PDFBuilder {
  doc: jsPDF;
  y: number;
  pw: number;

  constructor() {
    this.doc = new jsPDF();
    this.y = 0;
    this.pw = this.doc.internal.pageSize.getWidth();
  }

  checkPage(needed: number) {
    if (this.y + needed > 270) {
      this.doc.addPage();
      this.y = 25;
    }
  }

  // ── Cover Page ──
  drawCoverPage(title: string, subtitle: string, candidate: string, targetRole: string, date: string) {
    const { doc, pw } = this;

    // Full dark background
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, pw, 297, "F");

    // Accent line at top
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pw, 4, "F");

    // Logo area
    this.y = 50;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text("POWERED BY", pw / 2, this.y, { align: "center" });
    this.y += 12;
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text("SkillMirror AI", pw / 2, this.y, { align: "center" });

    // Divider
    this.y += 20;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(pw / 2 - 40, this.y, pw / 2 + 40, this.y);

    // Report Title
    this.y += 25;
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text(title, pw / 2, this.y, { align: "center" });

    this.y += 12;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(subtitle, pw / 2, this.y, { align: "center" });

    // Candidate Info Box
    this.y += 35;
    doc.setFillColor(30, 35, 55);
    doc.roundedRect(40, this.y, pw - 80, 50, 4, 4, "F");
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.3);
    doc.roundedRect(40, this.y, pw - 80, 50, 4, 4, "S");

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text("CANDIDATE", 55, this.y + 14);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    doc.text(candidate, 55, this.y + 26);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text("TARGET ROLE", 55, this.y + 36);
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.text(targetRole || "General Analysis", 55, this.y + 45);

    // Date
    this.y += 70;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(`Report Generated: ${date}`, pw / 2, this.y, { align: "center" });

    // Bottom accent
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 293, pw, 4, "F");

    // New page for content
    doc.addPage();
    this.y = 25;
  }

  // ── Executive Summary Score Cards ──
  drawScoreCards(scores: { label: string; value: string | number; color: [number, number, number] }[]) {
    const { doc, pw } = this;
    this.checkPage(45);

    const cardW = (pw - 40 - (scores.length - 1) * 5) / scores.length;

    scores.forEach((score, i) => {
      const x = 20 + i * (cardW + 5);
      doc.setFillColor(...COLORS.lightBg);
      doc.roundedRect(x, this.y, cardW, 35, 3, 3, "F");

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...score.color);
      doc.text(String(score.value), x + cardW / 2, this.y + 16, { align: "center" });

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.text);
      doc.text(score.label, x + cardW / 2, this.y + 26, { align: "center" });
    });

    this.y += 42;
  }

  // ── Section Header with divider ──
  drawSection(title: string) {
    this.checkPage(20);
    const { doc, pw } = this;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text(title, 20, this.y + 6);

    // Divider line
    this.y += 10;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(20, this.y, pw - 20, this.y);
    this.y += 8;
  }

  // ── Paragraph ──
  drawPara(text: string, size = 9, color = COLORS.text, bold = false, indent = 20) {
    this.checkPage(10);
    const clean = cleanText(text);
    if (!clean) return;
    this.doc.setFontSize(size);
    this.doc.setFont("helvetica", bold ? "bold" : "normal");
    this.doc.setTextColor(...color);
    const lines = this.doc.splitTextToSize(clean, this.pw - indent - 20);
    this.doc.text(lines, indent, this.y);
    this.y += lines.length * (size * 0.45) + 4;
  }

  // ── Bullet point ──
  drawBullet(text: string, color = COLORS.text) {
    this.checkPage(10);
    const clean = cleanText(text);
    if (!clean) return;
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...color);
    this.doc.text("\u2022", 24, this.y);
    this.doc.setTextColor(...COLORS.text);
    const lines = this.doc.splitTextToSize(clean, this.pw - 52);
    this.doc.text(lines, 30, this.y);
    this.y += lines.length * 4.5 + 3;
  }

  // ── Tag list (skills displayed inline) ──
  drawTags(tags: string[], color = COLORS.primary) {
    this.checkPage(12);
    const { doc, pw } = this;
    let x = 24;
    const maxX = pw - 24;

    tags.forEach((tag) => {
      const clean = cleanText(tag);
      if (!clean) return;
      doc.setFontSize(8);
      const w = doc.getTextWidth(clean) + 10;
      if (x + w > maxX) { x = 24; this.y += 10; this.checkPage(12); }

      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(x, this.y - 4, w, 8, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(clean, x + 5, this.y + 1);
      x += w + 4;
    });
    this.y += 14;
  }

  // ── Week-based roadmap ──
  drawRoadmap(weeks: { week: number; tasks: string[] }[]) {
    weeks.forEach((w) => {
      this.checkPage(20);
      this.drawPara(`Week ${w.week}`, 10, COLORS.primary, true, 24);
      w.tasks.forEach((t) => this.drawBullet(t, COLORS.primary));
      this.y += 3;
    });
  }

  // ── Footer on all pages ──
  addFooters() {
    const { doc, pw } = this;
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFillColor(...COLORS.dark);
      doc.rect(0, 284, pw, 13, "F");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.muted);
      doc.text("SkillMirror AI  |  Powered by Advanced AI Analysis  |  www.skillmirror.ai", 20, 291);
      doc.text(`Page ${i} of ${total}`, pw - 35, 291);
    }
  }

  save(filename: string) {
    this.addFooters();
    this.doc.save(filename);
  }
}

// ══════════════════════════════════════════════════
// CAREER ANALYSIS REPORT
// ══════════════════════════════════════════════════
export function generateCareerReport(
  r: any,
  userName: string,
  userEmail: string,
  targetRole: string
) {
  const pdf = new PDFBuilder();
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Cover Page
  pdf.drawCoverPage(
    "Professional Career Analysis Report",
    "Comprehensive AI-Powered Career Intelligence",
    userName,
    targetRole,
    date
  );

  // Executive Summary
  pdf.drawScoreCards([
    { label: "MATCH SCORE", value: `${r.matchScore || 0}%`, color: COLORS.primary },
    { label: "ATS SCORE", value: `${r.ATSScore || 0}%`, color: COLORS.purple },
    { label: "CAREER LEVEL", value: r.careerLevel || "N/A", color: COLORS.dark },
    { label: "MARKET DEMAND", value: r.marketDemandLevel || "N/A", color: COLORS.green },
  ]);

  pdf.drawPara(`Estimated Salary: ${r.estimatedSalaryRange || "N/A"}`, 10, COLORS.dark, true);
  pdf.y += 4;

  // Profile Summary
  if (r.profileSummary) {
    pdf.drawSection("Profile Summary");
    pdf.drawPara(r.profileSummary);
    pdf.y += 4;
  }

  // Core Skills
  if (r.coreSkills?.length) {
    pdf.drawSection("Technical Skills");
    pdf.drawTags(r.coreSkills, COLORS.primary);
  }

  // Soft Skills
  if (r.softSkills?.length) {
    pdf.drawSection("Soft Skills");
    pdf.drawTags(r.softSkills, COLORS.purple);
  }

  // Skills Gap
  if (r.missingSkills?.length) {
    pdf.drawSection("Skills Gap Analysis");
    r.missingSkills.forEach((s: string) => pdf.drawBullet(s, COLORS.red));
    pdf.y += 4;
  }

  // Strengths
  if (r.strengths?.length) {
    pdf.drawSection("Strengths");
    r.strengths.forEach((s: string) => pdf.drawBullet(s, COLORS.green));
    pdf.y += 4;
  }

  // Weaknesses
  if (r.weaknesses?.length) {
    pdf.drawSection("Areas for Improvement");
    r.weaknesses.forEach((s: string) => pdf.drawBullet(s, COLORS.red));
    pdf.y += 4;
  }

  // Suggestions
  if (r.improvementSuggestions?.length) {
    pdf.drawSection("Improvement Suggestions");
    r.improvementSuggestions.forEach((s: string) => pdf.drawBullet(s, COLORS.primary));
    pdf.y += 4;
  }

  // Certifications
  if (r.certifications?.length) {
    pdf.drawSection("Recommended Certifications");
    r.certifications.forEach((s: string) => pdf.drawBullet(s, COLORS.purple));
    pdf.y += 4;
  }

  // Projects
  if (r.suggestedProjects?.length) {
    pdf.drawSection("Suggested Projects");
    r.suggestedProjects.forEach((p: any) => {
      pdf.drawPara(p.title, 10, COLORS.dark, true, 24);
      pdf.drawPara(p.description, 9, COLORS.text, false, 24);
    });
    pdf.y += 4;
  }

  // 30-Day Roadmap
  if (r.thirtyDayRoadmap?.length) {
    pdf.drawSection("30-Day Career Roadmap");
    pdf.drawRoadmap(r.thirtyDayRoadmap);
    pdf.y += 4;
  }

  // Key Actions
  if (r.keyActions?.length) {
    pdf.drawSection("Key Actions This Month");
    r.keyActions.forEach((a: string, i: number) => {
      pdf.drawPara(`${i + 1}. ${a}`, 9, COLORS.dark, true, 24);
    });
    pdf.y += 4;
  }

  // Career Direction
  if (r.bestCareerDirection) {
    pdf.drawSection("Best Career Direction");
    pdf.drawPara(r.bestCareerDirection, 10, COLORS.dark, true);
    pdf.y += 4;
  }

  // Skills to Focus
  if (r.skillsToFocus?.length) {
    pdf.drawSection("Skills to Focus On");
    pdf.drawTags(r.skillsToFocus, COLORS.primary);
  }

  // Risk Factors
  if (r.riskFactors?.length) {
    pdf.drawSection("Risk Factors");
    r.riskFactors.forEach((s: string) => pdf.drawBullet(s, COLORS.red));
    pdf.y += 4;
  }

  // Resume Tips
  if (r.resumeRewriteSuggestions?.length) {
    pdf.drawSection("Resume Optimization Tips");
    r.resumeRewriteSuggestions.forEach((s: string) => pdf.drawBullet(s, COLORS.primary));
    pdf.y += 4;
  }

  // Job Keywords
  if (r.jobSearchKeywords?.length) {
    pdf.drawSection("Job Search Keywords");
    pdf.drawTags(r.jobSearchKeywords, COLORS.dark);
  }

  pdf.save(`SkillMirror-Career-Report-${targetRole || "General"}.pdf`);
}

// ══════════════════════════════════════════════════
// ATS ANALYSIS REPORT
// ══════════════════════════════════════════════════
export function generateATSReport(
  results: any,
  targetRole: string,
  userName: string,
  userEmail: string
) {
  const pdf = new PDFBuilder();
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  pdf.drawCoverPage(
    "ATS Compatibility Report",
    `Role-Specific ATS Analysis for ${targetRole}`,
    userName,
    targetRole,
    date
  );

  // Score cards
  const scores: { label: string; value: string | number; color: [number, number, number] }[] = [
    { label: "ATS SCORE", value: `${results.ats_score || 0}%`, color: COLORS.primary },
  ];
  if (results.keyword_density) {
    scores.push({ label: "KEYWORD DENSITY", value: `${results.keyword_density.present || 0}%`, color: COLORS.purple });
    scores.push({ label: "OPTIMAL TARGET", value: `${results.keyword_density.optimal || 85}%`, color: COLORS.green });
  }
  if (results.section_scores?.overall_format != null) {
    scores.push({ label: "FORMAT SCORE", value: `${results.section_scores.overall_format}%`, color: COLORS.dark });
  }
  pdf.drawScoreCards(scores);

  if (results.summary_feedback) {
    pdf.drawSection("Executive Summary");
    pdf.drawPara(results.summary_feedback);
    pdf.y += 4;
  }

  if (results.matching_skills?.length) {
    pdf.drawSection("Matching Keywords");
    pdf.drawTags(results.matching_skills, COLORS.green);
  }

  if (results.missing_skills?.length) {
    pdf.drawSection("Missing Keywords");
    pdf.drawTags(results.missing_skills, COLORS.red);
  }

  if (results.remove_suggestions?.length) {
    pdf.drawSection("Content to Remove");
    results.remove_suggestions.forEach((s: string) => pdf.drawBullet(s, COLORS.red));
    pdf.y += 4;
  }

  if (results.weak_sections?.length) {
    pdf.drawSection("Weak Sections");
    results.weak_sections.forEach((s: string) => pdf.drawBullet(s, COLORS.text));
    pdf.y += 4;
  }

  if (results.improvement_tips?.length) {
    pdf.drawSection("Improvement Recommendations");
    results.improvement_tips.forEach((s: string) => pdf.drawBullet(s, COLORS.primary));
    pdf.y += 4;
  }

  if (results.formatting_issues?.length) {
    pdf.drawSection("Formatting Issues");
    results.formatting_issues.forEach((s: string) => pdf.drawBullet(s, COLORS.text));
    pdf.y += 4;
  }

  if (results.section_scores) {
    pdf.drawSection("Section-by-Section Scores");
    Object.entries(results.section_scores).forEach(([key, val]) => {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      pdf.drawPara(`${label}: ${val}%`, 10, Number(val) >= 70 ? COLORS.green : COLORS.red, true, 28);
    });
    pdf.y += 4;
  }

  if (results.keyword_density?.suggestion) {
    pdf.drawSection("Keyword Optimization");
    pdf.drawPara(results.keyword_density.suggestion);
  }

  pdf.save(`SkillMirror-ATS-Report-${targetRole}.pdf`);
}

// ══════════════════════════════════════════════════
// RESUME OPTIMIZATION REPORT
// ══════════════════════════════════════════════════
export function generateRewriterReport(
  results: any,
  userName: string,
  userEmail: string
) {
  const pdf = new PDFBuilder();
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  pdf.drawCoverPage(
    "Resume Optimization Report",
    "AI-Powered Resume Enhancement Analysis",
    userName,
    "Resume Optimization",
    date
  );

  // Score cards
  if (results.optimization_score) {
    pdf.drawScoreCards([
      { label: "BEFORE OPTIMIZATION", value: `${results.optimization_score.before}%`, color: COLORS.red },
      { label: "AFTER OPTIMIZATION", value: `${results.optimization_score.after}%`, color: COLORS.green },
      { label: "IMPROVEMENT", value: `+${(results.optimization_score.after || 0) - (results.optimization_score.before || 0)}%`, color: COLORS.primary },
    ]);
  }

  if (results.optimized_summary) {
    pdf.drawSection("Optimized Professional Summary");
    pdf.drawPara(results.optimized_summary);
    pdf.y += 4;
  }

  if (results.optimized_skills?.length) {
    pdf.drawSection("Optimized Skills");
    pdf.drawTags(results.optimized_skills, COLORS.primary);
  }

  if (results.optimized_experience?.length) {
    pdf.drawSection("Experience Rewrites (Before vs After)");
    results.optimized_experience.forEach((item: any) => {
      pdf.checkPage(20);
      pdf.drawPara("Before: " + (item.original || ""), 8, COLORS.red, false, 28);
      pdf.drawPara("After: " + (item.optimized || ""), 9, COLORS.green, true, 28);
      pdf.y += 3;
    });
    pdf.y += 4;
  }

  if (results.added_keywords?.length) {
    pdf.drawSection("Keywords Added");
    pdf.drawTags(results.added_keywords, COLORS.green);
  }

  if (results.removed_content?.length) {
    pdf.drawSection("Content Removed");
    results.removed_content.forEach((s: string) => pdf.drawBullet(s, COLORS.red));
    pdf.y += 4;
  }

  if (results.missing_from_resume?.length) {
    pdf.drawSection("Critical Gaps");
    results.missing_from_resume.forEach((s: string) => pdf.drawBullet(s, COLORS.red));
    pdf.y += 4;
  }

  if (results.additional_tips?.length) {
    pdf.drawSection("Additional Recommendations");
    results.additional_tips.forEach((s: string) => pdf.drawBullet(s, COLORS.primary));
    pdf.y += 4;
  }

  if (results.tone_feedback) {
    pdf.drawSection("Tone Analysis");
    pdf.drawPara(results.tone_feedback);
    pdf.y += 4;
  }

  if (results.full_optimized_resume) {
    pdf.drawSection("Full Optimized Resume");
    pdf.drawPara(results.full_optimized_resume);
  }

  pdf.save("SkillMirror-Resume-Optimization-Report.pdf");
}
