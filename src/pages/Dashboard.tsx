import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnalysisCard } from "@/components/dashboard/AnalysisCard";
import { ResultsDisplay } from "@/components/dashboard/ResultsDisplay";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { Routes, Route } from "react-router-dom";
import DashboardHistory from "./DashboardHistory";
import DashboardReports from "./DashboardReports";
import DashboardSettings from "./DashboardSettings";
import DashboardATS from "./DashboardATS";
import DashboardRewriter from "./DashboardRewriter";

const AnalysisPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async (data: { resumeText: string; jobDescription: string; targetRole: string; location: string }) => {
    setLoading(true);
    setResults(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Please sign in first", variant: "destructive" });
        return;
      }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Analysis failed");
      }

      const { results: r } = await resp.json();
      setResults(r);
      toast({ title: "Analysis Complete!", description: `Match Score: ${r.matchScore}%` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnalysisCard onAnalyze={handleAnalyze} loading={loading} />
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <Sparkles className="w-16 h-16 text-primary" />
              </motion.div>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-lg font-display gradient-text"
              >
                AI is deeply analyzing your resume...
              </motion.p>
              <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {results && (
        <div className="mt-6">
          <ResultsDisplay results={results} />
        </div>
      )}
    </>
  );
};

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
            <Routes>
              <Route index element={<AnalysisPage />} />
              <Route path="ats" element={<DashboardATS />} />
              <Route path="rewriter" element={<DashboardRewriter />} />
              <Route path="history" element={<DashboardHistory />} />
              <Route path="reports" element={<DashboardReports />} />
              <Route path="settings" element={<DashboardSettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
