import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { generateCareerReport } from "@/lib/pdf-generator";

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

  const handleDownload = (analysis: any) => {
    const r = analysis.results_json as any;
    if (!r) return;
    generateCareerReport(
      r,
      profile?.display_name || "User",
      profile?.email || "",
      analysis.target_role || "General"
    );
  };

  return (
    <div className="space-y-4">
      <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="font-display text-xl font-bold flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" /> Reports
      </motion.h2>
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
              <Button size="sm" variant="outline" className="neon-border" onClick={() => handleDownload(a)} disabled={!a.results_json}>
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
