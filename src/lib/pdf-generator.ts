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
// RESUME PDF DOWNLOAD (Clean Format)
// ══════════════════════════════════════════════════
export function downloadResumePDF(resumeText: string, fileName: string = "Optimized_Resume") {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 20;
  const lineHeight = 6;
  const maxWidth = pageWidth - (margin * 2);

  // Clean the resume text - remove all markdown symbols
  const cleanResume = resumeText
    .replace(/[#*_~`>]/g, "")
    .replace(/^- /gm, "")
    .replace(/^\* /gm, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Split into lines
  const lines = cleanResume.split("\n");

  lines.forEach((line) => {
    line = line.trim();
    if (!line) {
      y += lineHeight / 2;
      return;
    }

    // Check if we need a new page
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    // Detect headers (all caps or specific patterns)
    const isHeader = /^[A-Z][A-Z\s]+$/.test(line) || 
                     /^(SUMMARY|EXPERIENCE|PROJECTS|SKILLS|EDUCATION|AWARDS|CERTIFICATIONS|CONTACT)/i.test(line);

    if (isHeader) {
      // Add spacing before headers
      y += 8;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 100, 150);
      doc.text(line, margin, y);
      // Add underline
      doc.setDrawColor(0, 100, 150);
      doc.setLineWidth(0.3);
      doc.line(margin, y + 2, margin + doc.getTextWidth(line), y + 2);
      y += lineHeight;
    } else if (line.startsWith("•") || line.startsWith("-")) {
      // Bullet points
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const bulletText = line.replace(/^[•\-]\s*/, "");
      const wrappedLines = doc.splitTextToSize(bulletText, maxWidth - 10);
      wrappedLines.forEach((wrappedLine: string, idx: number) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }
        if (idx === 0) {
          doc.text("•", margin, y);
        }
        doc.text(wrappedLine, margin + 8, y);
        y += lineHeight;
      });
    } else if (/^[\d]+\./.test(line)) {
      // Numbered items
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const wrappedLines = doc.splitTextToSize(line, maxWidth);
      wrappedLines.forEach((wrappedLine: string) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }
        doc.text(wrappedLine, margin, y);
        y += lineHeight;
      });
    } else {
      // Regular text
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const wrappedLines = doc.splitTextToSize(line, maxWidth);
      wrappedLines.forEach((wrappedLine: string) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }
        doc.text(wrappedLine, margin, y);
        y += lineHeight;
      });
    }
  });

  doc.save(`${fileName}.pdf`);
}

// ══════════════════════════════════════════════════
// RESUME DOCX DOWNLOAD (Clean Format)
// ══════════════════════════════════════════════════
export function downloadResumeDOCX(resumeText: string, fileName: string = "Optimized_Resume") {
  // Clean the resume text - remove all markdown symbols
  const cleanResume = resumeText
    .replace(/[#*_~`>]/g, "")
    .replace(/^- /gm, "")
    .replace(/^\* /gm, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Create a styled HTML document for Word
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #333333;
        }
        .header {
          font-size: 14pt;
          font-weight: bold;
          color: #006496;
          margin-top: 16pt;
          margin-bottom: 8pt;
          border-bottom: 1px solid #006496;
          padding-bottom: 4pt;
        }
        .name {
          font-size: 18pt;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 4pt;
        }
        .contact {
          font-size: 10pt;
          color: #666666;
          margin-bottom: 12pt;
        }
        .section {
          margin-bottom: 12pt;
        }
        .bullet {
          margin-left: 20pt;
          margin-bottom: 4pt;
        }
        .company {
          font-weight: bold;
          color: #1a1a1a;
        }
        .role {
          font-weight: bold;
          color: #006496;
        }
      </style>
    </head>
    <body>
      ${formatResumeForDOCX(cleanResume)}
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatResumeForDOCX(text: string): string {
  const lines = text.split('\n');
  let html = '';

  lines.forEach((line) => {
    line = line.trim();
    if (!line) {
      html += '<br>';
      return;
    }

    // Detect headers
    const isHeader = /^[A-Z][A-Z\s]+$/.test(line) || 
                     /^(SUMMARY|EXPERIENCE|PROJECTS|SKILLS|EDUCATION|AWARDS|CERTIFICATIONS|CONTACT)/i.test(line);

    if (isHeader) {
      html += `<div class="header">${line}</div>`;
    } else if (line.startsWith('•') || line.startsWith('-')) {
      const bulletText = line.replace(/^[•\-]\s*/, '');
      html += `<div class="bullet">• ${bulletText}</div>`;
    } else {
      html += `<div>${line}</div>`;
    }
  });

  return html;
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

  // ATS Match Score
  if (results.ats_match_score) {
    pdf.drawScoreCards([
      { label: "ATS MATCH SCORE", value: `${results.ats_match_score}%`, color: COLORS.primary },
      { label: "INTERVIEW PROBABILITY", value: `${results.interview_strength_analysis?.interview_probability || 0}%`, color: COLORS.green },
    ]);
  }

  // Keyword Match Breakdown
  if (results.keyword_match_breakdown) {
    pdf.drawSection("Keyword Match Breakdown");
    if (results.keyword_match_breakdown.core_skills_matched?.length) {
      pdf.drawPara("Core Skills Matched:", 9, COLORS.dark, true, 24);
      pdf.drawTags(results.keyword_match_breakdown.core_skills_matched, COLORS.green);
    }
    if (results.keyword_match_breakdown.keywords_integrated?.length) {
      pdf.drawPara("Keywords Integrated:", 9, COLORS.dark, true, 24);
      pdf.drawTags(results.keyword_match_breakdown.keywords_integrated, COLORS.primary);
    }
    pdf.y += 4;
  }

  // Gaps Identified
  if (results.gaps_identified) {
    pdf.drawSection("Gap Analysis");
    if (results.gaps_identified.matched_skills?.length) {
      pdf.drawPara("Matched Skills:", 9, COLORS.dark, true, 24);
      pdf.drawTags(results.gaps_identified.matched_skills, COLORS.green);
    }
    if (results.gaps_identified.missing_but_learnable?.length) {
      pdf.drawPara("Missing But Learnable:", 9, COLORS.dark, true, 24);
      results.gaps_identified.missing_but_learnable.forEach((s: string) => pdf.drawBullet(s, COLORS.text));
    }
    if (results.gaps_identified.completely_missing_critical?.length) {
      pdf.drawPara("Critical Missing:", 9, COLORS.red, true, 24);
      results.gaps_identified.completely_missing_critical.forEach((s: string) => pdf.drawBullet(s, COLORS.red));
    }
    pdf.y += 4;
  }

  // Optimized Summary
  if (results.optimized_summary) {
    pdf.drawSection("Optimized Professional Summary");
    pdf.drawPara(results.optimized_summary);
    pdf.y += 4;
  }

  // Optimized Experience
  if (results.optimized_experience?.length) {
    pdf.drawSection("Optimized Experience");
    results.optimized_experience.forEach((item: any) => {
      pdf.checkPage(30);
      pdf.drawPara(`${item.role} at ${item.company}`, 10, COLORS.dark, true, 24);
      pdf.drawPara(item.duration || "", 8, COLORS.text, false, 24);
      if (item.bullets) {
        item.bullets.forEach((bullet: string) => pdf.drawBullet(bullet, COLORS.text));
      }
      pdf.y += 4;
    });
  }

  // Optimized Projects
  if (results.optimized_projects?.length) {
    pdf.drawSection("Optimized Projects");
    results.optimized_projects.forEach((item: any) => {
      pdf.checkPage(25);
      pdf.drawPara(item.name, 10, COLORS.dark, true, 24);
      if (item.tech_stack?.length) {
        pdf.drawPara(`Tech Stack: ${item.tech_stack.join(", ")}`, 8, COLORS.primary, false, 24);
      }
      if (item.bullets) {
        item.bullets.forEach((bullet: string) => pdf.drawBullet(bullet, COLORS.text));
      }
      pdf.y += 3;
    });
  }

  // Optimized Skills
  if (results.optimized_skills && Object.keys(results.optimized_skills).length > 0) {
    pdf.drawSection("Optimized Skills");
    Object.entries(results.optimized_skills).forEach(([category, skills]: [string, any]) => {
      if (skills?.length) {
        pdf.drawPara(`${category.replace(/_/g, " ")}:`, 9, COLORS.dark, true, 24);
        pdf.drawTags(skills, COLORS.primary);
      }
    });
  }

  // Interview Strength Analysis
  if (results.interview_strength_analysis) {
    pdf.drawSection("Interview Strength Analysis");
    if (results.interview_strength_analysis.strengths?.length) {
      pdf.drawPara("Strengths:", 9, COLORS.green, true, 24);
      results.interview_strength_analysis.strengths.forEach((s: string) => pdf.drawBullet(s, COLORS.green));
    }
    if (results.interview_strength_analysis.weaknesses?.length) {
      pdf.drawPara("Areas to Improve:", 9, COLORS.red, true, 24);
      results.interview_strength_analysis.weaknesses.forEach((s: string) => pdf.drawBullet(s, COLORS.red));
    }
    if (results.interview_strength_analysis.overall_impression) {
      pdf.drawPara(`Overall Impression: ${results.interview_strength_analysis.overall_impression}`, 10, COLORS.dark, true, 24);
    }
    pdf.y += 4;
  }

  // Improvement Suggestions
  if (results.improvement_suggestions?.length) {
    pdf.drawSection("Suggestions to Improve Selection Chances");
    results.improvement_suggestions.forEach((s: string, i: number) => {
      pdf.drawPara(`${i + 1}. ${s}`, 9, COLORS.text, false, 24);
    });
    pdf.y += 4;
  }

  // Full Optimized Resume
  if (results.full_optimized_resume) {
    pdf.drawSection("Full Optimized Resume");
    const cleanResume = results.full_optimized_resume
      .replace(/[#*_~`>]/g, "")
      .replace(/^- /gm, "")
      .replace(/^\* /gm, "");
    pdf.drawPara(cleanResume, 9, COLORS.text, false, 20);
  }

  pdf.save("SkillMirror-Resume-Optimization-Report.pdf");
}
