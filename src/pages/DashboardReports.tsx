import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import jsPDF from "jspdf";

const DashboardReports = () => {
  const { user, profile } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("analyses")
      .select("id, created_at, target_role, match_score, results_json")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAnalyses(data || []);
        setLoading(false);
      });
  }, [user]);

  const generatePDF = (analysis: any) => {
    const r = analysis.results_json as any;
    if (!r) return;

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

    const checkPage = (needed: number) => { if (y + needed > 275) { doc.addPage(); y = 20; } };

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

    // Header
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
    doc.text(`Generated: ${new Date(analysis.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 20, 34);
    doc.text("www.skillmirror.ai", pageWidth - 50, 34);
    y = 55;

    // User info
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(20, y, pageWidth - 40, 16, 3, 3, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.dark);
    doc.text(`Candidate: ${profile?.display_name || "User"}`, 26, y + 8);
    doc.text(`Target Role: ${analysis.target_role || "General"}`, pageWidth / 2, y + 8);
    y += 24;

    // Scores
    if (r.matchScore) { drawText(`Match Score: ${r.matchScore}%`, 14, colors.primary, true); }
    if (r.ATSScore) { drawText(`ATS Score: ${r.ATSScore}%`, 14, colors.purple, true); }
    if (r.careerLevel) { drawText(`Career Level: ${r.careerLevel}`, 10, colors.dark, true); }
    if (r.estimatedSalaryRange) { drawText(`Salary: ${r.estimatedSalaryRange} | Market Demand: ${r.marketDemandLevel || "N/A"}`); }
    y += 4;

    if (r.profileSummary) { drawSectionHeader("Profile Summary"); drawText(r.profileSummary); y += 4; }
    if (r.coreSkills?.length) { drawSectionHeader("Core Skills"); drawText(r.coreSkills.join("  |  "), 9, colors.primary, true); y += 4; }
    if (r.missingSkills?.length) { drawSectionHeader("Skills Gap"); r.missingSkills.forEach((s: string) => drawBullet(s, colors.red)); y += 4; }
    if (r.strengths?.length) { drawSectionHeader("Strengths"); r.strengths.forEach((s: string) => drawBullet(s, colors.green)); y += 4; }
    if (r.weaknesses?.length) { drawSectionHeader("Areas for Improvement"); r.weaknesses.forEach((s: string) => drawBullet(s, colors.red)); y += 4; }
    if (r.improvementSuggestions?.length) { drawSectionHeader("Suggestions"); r.improvementSuggestions.forEach((s: string) => drawBullet(s, colors.primary)); y += 4; }
    if (r.certifications?.length) { drawSectionHeader("Certifications"); r.certifications.forEach((s: string) => drawBullet(s, colors.purple)); y += 4; }
    if (r.thirtyDayRoadmap?.length) {
      drawSectionHeader("30-Day Roadmap");
      r.thirtyDayRoadmap.forEach((w: any) => { drawText(`Week ${w.week}`, 10, colors.primary, true, 24); w.tasks.forEach((t: string) => drawBullet(t, colors.primary)); y += 2; });
      y += 4;
    }
    if (r.keyActions?.length) { drawSectionHeader("Key Actions"); r.keyActions.forEach((a: string, i: number) => drawText(`${i + 1}. ${a}`, 9, colors.dark, true, 24)); y += 4; }
    if (r.bestCareerDirection) { drawSectionHeader("Career Direction"); drawText(r.bestCareerDirection, 10, colors.dark, true); }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(...colors.dark);
      doc.rect(0, 285, pageWidth, 12, "F");
      doc.setFontSize(7);
      doc.setTextColor(180, 200, 220);
      doc.text("SkillMirror AI  |  Powered by Advanced AI  |  www.skillmirror.ai", 20, 291);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 35, 291);
    }

    doc.save(`SkillMirror-Report-${analysis.target_role || "General"}.pdf`);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" /> Reports
      </h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : analyses.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">No reports available. Complete an analysis first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{a.target_role || "General Analysis"}</p>
                <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                {a.match_score != null && <p className="text-xs text-primary font-bold mt-1">Match: {a.match_score}%</p>}
              </div>
              <Button size="sm" variant="outline" className="neon-border" onClick={() => generatePDF(a)} disabled={!a.results_json}>
                <Download className="h-3 w-3 mr-1" /> Download PDF
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardReports;
