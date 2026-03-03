import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Download, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface SavedReport {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  report_type: string;
  target_role: string | null;
  created_at: string;
}

const DashboardReports = () => {
  const { user, profile } = useAuth();
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchReports();
    fetchAnalyses();
  }, [user]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_reports")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const { data } = await supabase
        .from("analyses")
        .select("id, created_at, target_role, match_score, results_json")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      setAnalyses(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: SavedReport) => {
    try {
      window.open(report.file_url, "_blank");
      toast({ title: "Downloading Report", description: report.file_name });
    } catch (error) {
      console.error("Download error:", error);
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handleDelete = async (report: SavedReport) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    
    setDeleting(report.id);
    try {
      const filePath = report.file_url.split("/").slice(-2).join("/");
      await supabase.storage.from("reports").remove([filePath]);
      await supabase.from("saved_reports").delete().eq("id", report.id);
      
      setSavedReports(prev => prev.filter(r => r.id !== report.id));
      toast({ title: "Report deleted" });
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Failed to delete report", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleGenerateAndSave = async (analysis: any) => {
    const r = analysis.results_json as any;
    if (!r) return;

    try {
      const htmlContent = generateReportHTML(r, profile?.display_name || "User", profile?.email || "", analysis.target_role || "General");
      const blob = new Blob([htmlContent], { type: "text/html" });

      const fileName = `reports/${user?.id}/${Date.now()}_${analysis.target_role || "General"}_report.html`;
      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("reports")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from("saved_reports")
        .insert({
          user_id: user?.id,
          file_name: `${analysis.target_role || "General"}_report.html`,
          file_url: publicUrl,
          file_size: blob.size,
          report_type: "career_analysis",
          target_role: analysis.target_role,
        });

      if (dbError) throw dbError;

      toast({ title: "Report saved!", description: "You can download it anytime" });
      fetchReports();
    } catch (error) {
      console.error("Error saving report:", error);
      toast({ title: "Failed to save report", variant: "destructive" });
    }
  };

  const generateReportHTML = (results: any, userName: string, email: string, targetRole: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Career Analysis Report - ${userName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .score { font-size: 48px; font-weight: bold; color: #6366f1; }
    .section { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .skill-tag { display: inline-block; background: #6366f1; color: white; padding: 4px 12px; border-radius: 20px; margin: 4px; font-size: 12px; }
    .meta { color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Career Analysis Report</h1>
  <p class="meta">Generated for: ${userName} (${email})</p>
  <p class="meta">Target Role: ${targetRole}</p>
  <p class="meta">Date: ${new Date().toLocaleDateString()}</p>
  
  ${results.overall_score ? `<div class="section"><h2>Overall Match Score</h2><p class="score">${results.overall_score}%</p></div>` : ''}
  
  ${results.skills_gap ? `
    <h2>Skills Analysis</h2>
    <div class="section">
      <h3>Skills to Develop</h3>
      ${(results.skills_gap.missing_skills || []).map((s: string) => `<span class="skill-tag">${s}</span>`).join('')}
    </div>
    <div class="section">
      <h3>Current Skills</h3>
      ${(results.skills_gap.current_skills || []).map((s: string) => `<span class="skill-tag" style="background: #10b981;">${s}</span>`).join('')}
    </div>
  ` : ''}
  
  ${results.recommendations ? `
    <h2>Recommendations</h2>
    <div class="section"><ol>${(results.recommendations || []).map((r: string) => `<li style="margin: 10px 0;">${r}</li>`).join('')}</ol></div>
  ` : ''}
  
  <p style="margin-top: 40px; color: #9ca3af; font-size: 12px; text-align: center;">Generated by SkillMirror AI</p>
</body>
</html>`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="font-display text-xl font-bold flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" /> My Reports
      </motion.h2>

      {savedReports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Saved Reports</h3>
          {savedReports.map((report, i) => (
            <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass-card">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <FileText className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{report.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()} • {formatFileSize(report.file_size)}
                      </p>
                      {report.target_role && <p className="text-xs text-primary font-medium mt-0.5">{report.target_role}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleDownload(report)} className="neon-border">
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(report)} disabled={deleting === report.id} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                      {deleting === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {analyses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Generate from Analysis</h3>
          {analyses.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{a.target_role || "General Analysis"}</p>
                <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                {a.match_score != null && <p className="text-xs text-primary font-bold mt-1">Match: {a.match_score}%</p>}
              </div>
              <Button size="sm" variant="outline" className="neon-border" onClick={() => handleGenerateAndSave(a)} disabled={!a.results_json}>
                <Download className="h-3 w-3 mr-1" /> Generate & Save
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {savedReports.length === 0 && analyses.length === 0 && (
        <div className="glass-card p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No reports available.</p>
          <p className="text-xs text-muted-foreground mt-1">Complete an analysis to generate reports.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardReports;
