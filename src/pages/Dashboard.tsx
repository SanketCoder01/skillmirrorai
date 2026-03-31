import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnalysisCard } from "@/components/dashboard/AnalysisCard";
import { ResultsDisplay } from "@/components/dashboard/ResultsDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { Routes, Route } from "react-router-dom";
import DashboardHistory from "./DashboardHistory";
import DashboardReports from "./DashboardReports";
import DashboardATS from "./DashboardATS";
import DashboardRewriter from "./DashboardRewriter";
import DashboardVerifier from "./DashboardVerifier";
import DashboardRoadmap from "./DashboardRoadmap";
import DashboardCertificate from "./DashboardCertificate";
import StudentInbox from "./StudentInbox";
import StudentProfile from "./StudentProfile";
import ResumeAnalyticsDashboard from "@/components/dashboard/ResumeAnalyticsDashboard";

// Main Dashboard Overview Component - Now uses ResumeAnalyticsDashboard
const DashboardOverview = () => {
  const { profile } = useAuth();
  return <ResumeAnalyticsDashboard profile={profile} />;
};

// Resume Analysis Page (moved to /dashboard/analysis)
const ResumeAnalysisPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log when component renders
  useEffect(() => {
    console.log("ResumeAnalysisPage mounted");
    return () => console.log("ResumeAnalysisPage unmounted");
  }, []);

  const handleAnalyze = async (data: { resumeText: string; jobDescription: string; targetRole: string; location: string }) => {
    console.log("handleAnalyze called with data:", { hasResumeText: !!data.resumeText, resumeLength: data.resumeText?.length });
    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Please sign in first", variant: "destructive" });
        setLoading(false);
        return;
      }

      console.log("Calling analyze-resume function...");
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", resp.status);
      
      if (!resp.ok) {
        const err = await resp.json();
        console.error("API error:", err);
        throw new Error(err.error || "Analysis failed");
      }

      const responseData = await resp.json();
      console.log("Response data:", responseData);
      
      const { results: r } = responseData;
      console.log("Results extracted:", r);
      
      if (!r) {
        throw new Error("No results returned from analysis");
      }
      
      setResults(r);
      toast({ title: "Analysis Complete!", description: `Match Score: ${r.matchScore}%` });
    } catch (e: any) {
      console.error("Analysis error:", e);
      setError(e.message || "Analysis failed");
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AnalysisCard onAnalyze={handleAnalyze} loading={loading} />
      
      {/* Debug info */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-500 font-medium">Error: {error}</p>
        </div>
      )}
      
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
    </div>
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
              <Route index element={<DashboardOverview />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="inbox" element={<StudentInbox />} />
              <Route path="analysis" element={<ResumeAnalysisPage />} />
              <Route path="verifier" element={<DashboardVerifier />} />
              {/* Skill Test route removed from user side */}
              <Route path="roadmap" element={<DashboardRoadmap />} />
              <Route path="certificate" element={<DashboardCertificate />} />
              <Route path="ats" element={<DashboardATS />} />
              <Route path="rewriter" element={<DashboardRewriter />} />
              <Route path="history" element={<DashboardHistory />} />
              <Route path="reports" element={<DashboardReports />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
