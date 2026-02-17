import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import jsPDF from "jspdf";

const DashboardReports = () => {
  const { user } = useAuth();
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
    let y = 20;
    const addLine = (text: string, size = 10, bold = false) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, 20, y);
      y += lines.length * (size * 0.5) + 4;
    };
    addLine("SkillMirror AI - Career Report", 18, true);
    addLine(`Date: ${new Date(analysis.created_at).toLocaleDateString()}`, 9);
    addLine(`Role: ${analysis.target_role || "General"}`, 10);
    y += 5;
    if (r.profileSummary) { addLine("Profile Summary", 14, true); addLine(r.profileSummary); }
    if (r.matchScore) addLine(`Match Score: ${r.matchScore}%`, 11, true);
    if (r.ATSScore) addLine(`ATS Score: ${r.ATSScore}%`, 11, true);
    if (r.coreSkills?.length) { addLine("Core Skills", 12, true); addLine(r.coreSkills.join(", ")); }
    if (r.missingSkills?.length) { addLine("Missing Skills", 12, true); addLine(r.missingSkills.join(", ")); }
    doc.save(`SkillMirror-Report-${analysis.target_role || "general"}.pdf`);
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
