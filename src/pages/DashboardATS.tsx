import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Sparkles, ShieldCheck, CheckCircle, XCircle, AlertTriangle, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScoreCircle } from "@/components/dashboard/ScoreCircle";
import { useAuth } from "@/contexts/AuthContext";
import { generateATSReport } from "@/lib/pdf-generator";

const TARGET_ROLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Machine Learning Engineer",
  "Data Scientist",
  "Automation Engineer",
  "DevOps Engineer",
  "UI/UX Developer",
  "Cybersecurity",
];

const PROGRESS_STEPS = [
  { pct: 5, msg: "Initializing analysis..." },
  { pct: 12, msg: "Parsing resume text..." },
  { pct: 22, msg: "Extracting keywords..." },
  { pct: 32, msg: "Loading ATS templates..." },
  { pct: 42, msg: "Matching against role requirements..." },
  { pct: 52, msg: "Analyzing skill density..." },
  { pct: 62, msg: "Evaluating section quality..." },
  { pct: 72, msg: "Scoring formatting..." },
  { pct: 82, msg: "Generating recommendations..." },
  { pct: 90, msg: "Compiling final report..." },
  { pct: 95, msg: "Almost done..." },
];

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, delay: i * 0.08 },
});

const DashboardATS = () => {
  const { profile } = useAuth();
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProgress = () => {
    setProgress(PROGRESS_STEPS[0].pct);
    setProgressMsg(PROGRESS_STEPS[0].msg);
    let step = 0;
    progressRef.current = setInterval(() => {
      step++;
      if (step < PROGRESS_STEPS.length) {
        setProgress(PROGRESS_STEPS[step].pct);
        setProgressMsg(PROGRESS_STEPS[step].msg);
      }
    }, 2500);
  };

  const stopProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
    setProgressMsg("Complete!");
  };

  useEffect(() => { return () => { if (progressRef.current) clearInterval(progressRef.current); }; }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") { alert("Please upload a PDF file"); return; }
    setFileName(file.name);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      setResumeText(text.trim());
    } catch (e) {
      console.error("PDF parse error:", e);
      alert("Failed to parse PDF. Please paste your resume text manually.");
    }
  }, []);

  const handleAnalyze = async () => {
    const role = targetRole === "Other" ? customRole : targetRole;
    if (!resumeText.trim()) { toast({ title: "Error", description: "Please upload or paste your resume", variant: "destructive" }); return; }
    if (!role.trim()) { toast({ title: "Error", description: "Please select a target role", variant: "destructive" }); return; }

    setLoading(true);
    setResults(null);
    startProgress();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Error", description: "Please sign in first", variant: "destructive" }); return; }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ats-analyzer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ resumeText, targetRole: role }),
      });

      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Analysis failed"); }
      const { results: r } = await resp.json();
      stopProgress();
      setResults(r);
      toast({ title: "ATS Analysis Complete!", description: `Your ATS Score: ${r.ats_score}%` });

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("SkillMirror AI", { body: `ATS Analysis Complete! Score: ${r.ats_score}%` });
      }
    } catch (e: any) {
      stopProgress();
      console.error(e);
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const activeRole = targetRole === "Other" ? customRole : targetRole;

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="font-display text-xl font-bold flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" /> ATS Score Analyzer
      </motion.h2>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
        <div>
          <Label className="text-sm font-medium">Choose Target Role</Label>
          <Select value={targetRole} onValueChange={setTargetRole}>
            <SelectTrigger className="mt-1 bg-background/50"><SelectValue placeholder="Select a role..." /></SelectTrigger>
            <SelectContent>
              {TARGET_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              <SelectItem value="Other">Other (custom input)</SelectItem>
            </SelectContent>
          </Select>
          {targetRole === "Other" && (
            <Input value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="Enter custom role..." className="mt-2 bg-background/50" />
          )}
        </div>

        <div
          className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => document.getElementById("ats-upload")?.click()}
          onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); }}
          onDragOver={e => e.preventDefault()}
        >
          <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {fileName ? <span className="text-primary flex items-center justify-center gap-2"><FileText className="h-4 w-4" />{fileName}</span> : "Upload PDF resume or drag & drop"}
          </p>
          <input id="ats-upload" type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
        </div>

        {!fileName && (
          <div>
            <Label className="text-xs text-muted-foreground">Or paste resume text</Label>
            <Textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste resume content..." className="mt-1 bg-background/50 min-h-[100px]" />
          </div>
        )}

        <Button onClick={handleAnalyze} disabled={loading} className="w-full btn-glow bg-primary text-primary-foreground h-11">
          {loading ? (
            <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> Analyzing ATS...</span>
          ) : (
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Run ATS Analysis</span>
          )}
        </Button>
      </motion.div>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center">
            <div className="text-center w-80">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 mx-auto mb-4">
                <Sparkles className="w-16 h-16 text-primary" />
              </motion.div>
              <Progress value={progress} className="h-2 mb-3" />
              <p className="text-sm font-medium text-primary">{progress}%</p>
              <motion.p key={progressMsg} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-muted-foreground mt-1">{progressMsg}</motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Score Cards */}
          <motion.div {...fadeUp(0)} className="glass-card p-6">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <ScoreCircle score={results.ats_score} label="ATS Score" color="hsl(var(--neon-cyan))" size={140} />
              {results.section_scores && (
                <div className="grid grid-cols-2 gap-4 min-w-[200px]">
                  {Object.entries(results.section_scores).map(([key, val]) => (
                    <div key={key} className="glass-card p-3 text-center">
                      <p className="text-xs text-muted-foreground capitalize mb-1">{key.replace(/_/g, " ")}</p>
                      <p className="text-lg font-bold" style={{ color: Number(val) >= 70 ? "hsl(var(--neon-green))" : "hsl(var(--accent))" }}>{val as number}%</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Keyword density */}
          {results.keyword_density && (
            <motion.div {...fadeUp(1)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-3">Keyword Density Analysis</h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Present: {results.keyword_density.present}%</span>
                    <span>Optimal: {results.keyword_density.optimal}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={results.keyword_density.present} className="h-3" />
                    <div className="absolute top-0 h-3 border-r-2 border-primary" style={{ left: `${results.keyword_density.optimal}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{results.keyword_density.suggestion}</p>
            </motion.div>
          )}

          {/* Matching skills */}
          {results.matching_skills?.length > 0 && (
            <motion.div {...fadeUp(2)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-neon-green" /> Matching Keywords</h3>
              <div className="flex flex-wrap gap-2">{results.matching_skills.map((s: string) => <Badge key={s} className="bg-neon-green/20 text-neon-green border-neon-green/30">{s}</Badge>)}</div>
            </motion.div>
          )}

          {/* Missing skills */}
          {results.missing_skills?.length > 0 && (
            <motion.div {...fadeUp(3)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><XCircle className="h-4 w-4 text-accent" /> Missing Keywords</h3>
              <div className="flex flex-wrap gap-2">{results.missing_skills.map((s: string) => <Badge key={s} className="bg-accent/20 text-accent border-accent/30">{s}</Badge>)}</div>
            </motion.div>
          )}

          {/* Remove suggestions */}
          {results.remove_suggestions?.length > 0 && (
            <motion.div {...fadeUp(4)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Consider Removing</h3>
              <ul className="space-y-2">{results.remove_suggestions.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-destructive shrink-0">✗</span><span>{s}</span></li>)}</ul>
            </motion.div>
          )}

          {/* Weak sections */}
          {results.weak_sections?.length > 0 && (
            <motion.div {...fadeUp(5)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-secondary" /> Weak Sections</h3>
              <ul className="space-y-2">{results.weak_sections.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-secondary shrink-0">⚠</span><span>{s}</span></li>)}</ul>
            </motion.div>
          )}

          {/* Improvement tips */}
          {results.improvement_tips?.length > 0 && (
            <motion.div {...fadeUp(6)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Improvement Recommendations</h3>
              <ul className="space-y-2">{results.improvement_tips.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">{s}</li>)}</ul>
            </motion.div>
          )}

          {/* Formatting issues */}
          {results.formatting_issues?.length > 0 && (
            <motion.div {...fadeUp(7)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-3">Formatting Issues</h3>
              <ul className="space-y-2">{results.formatting_issues.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="shrink-0">•</span><span>{s}</span></li>)}</ul>
            </motion.div>
          )}

          {/* Summary feedback */}
          {results.summary_feedback && (
            <motion.div {...fadeUp(8)} className="glass-card p-6 neon-border">
              <h3 className="font-display font-bold mb-2 gradient-text">Overall Assessment</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{results.summary_feedback}</p>
            </motion.div>
          )}

          {/* PDF Export */}
          <motion.div {...fadeUp(9)} className="text-center">
            <Button
              onClick={() => generateATSReport(results, activeRole, profile?.display_name || "User", profile?.email || "")}
              size="lg"
              className="btn-glow bg-primary text-primary-foreground"
            >
              <Download className="h-4 w-4 mr-2" /> Download ATS Report PDF
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardATS;
