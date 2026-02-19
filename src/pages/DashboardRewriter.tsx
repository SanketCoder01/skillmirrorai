import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Sparkles, PenTool, ArrowRight, Copy, Download, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScoreCircle } from "@/components/dashboard/ScoreCircle";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";

function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[#\-*_~`>]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[^\x20-\x7E\n]/g, "")
    .trim();
}

function generateRewriterReport(results: any, userName: string, userEmail: string) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  let y = 0;
  const c = {
    primary: [0, 180, 216] as [number, number, number],
    dark: [20, 25, 45] as [number, number, number],
    text: [55, 65, 81] as [number, number, number],
    light: [243, 244, 246] as [number, number, number],
    green: [34, 197, 94] as [number, number, number],
    red: [239, 68, 68] as [number, number, number],
  };

  const check = (n: number) => { if (y + n > 275) { doc.addPage(); y = 20; } };

  const heading = (title: string) => {
    check(16);
    doc.setFillColor(...c.primary);
    doc.rect(20, y, 4, 8, "F");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...c.dark);
    doc.text(title, 28, y + 6);
    y += 14;
  };

  const para = (text: string, size = 9, color = c.text, bold = false, indent = 20) => {
    check(8);
    const clean = cleanText(text);
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(clean, pw - indent - 20);
    doc.text(lines, indent, y);
    y += lines.length * (size * 0.45) + 3;
  };

  const bullet = (text: string) => {
    check(8);
    const clean = cleanText(text);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...c.text);
    doc.text("\u2022", 24, y);
    const lines = doc.splitTextToSize(clean, pw - 52);
    doc.text(lines, 30, y);
    y += lines.length * 4.5 + 2;
  };

  // Header
  doc.setFillColor(...c.dark);
  doc.rect(0, 0, pw, 45, "F");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SkillMirror AI", 20, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 200, 220);
  doc.text("Resume Optimization Report", 20, 26);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 20, 34);
  doc.text("www.skillmirror.ai", pw - 50, 34);
  y = 55;

  // User info
  doc.setFillColor(...c.light);
  doc.roundedRect(20, y, pw - 40, 16, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...c.dark);
  doc.text(`Candidate: ${userName}`, 26, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Email: ${userEmail}`, 26, y + 12);
  y += 24;

  // Score
  if (results.optimization_score) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...c.red);
    doc.text(`Before: ${results.optimization_score.before}%`, pw / 2 - 30, y + 8, { align: "center" });
    doc.setTextColor(...c.green);
    doc.text(`After: ${results.optimization_score.after}%`, pw / 2 + 30, y + 8, { align: "center" });
    y += 18;
  }

  if (results.optimized_summary) {
    heading("Optimized Summary");
    para(results.optimized_summary);
    y += 4;
  }

  if (results.optimized_skills?.length) {
    heading("Optimized Skills");
    results.optimized_skills.forEach((s: string) => bullet(s));
    y += 4;
  }

  if (results.optimized_experience?.length) {
    heading("Experience Rewrites");
    results.optimized_experience.forEach((item: any) => {
      check(16);
      para("Before: " + (item.original || ""), 8, c.red, false, 28);
      para("After: " + (item.optimized || ""), 9, c.green, true, 28);
      y += 2;
    });
    y += 4;
  }

  if (results.added_keywords?.length) {
    heading("Added Keywords");
    results.added_keywords.forEach((s: string) => bullet(s));
    y += 4;
  }

  if (results.removed_content?.length) {
    heading("Removed Content");
    results.removed_content.forEach((s: string) => bullet(s));
    y += 4;
  }

  if (results.missing_from_resume?.length) {
    heading("Missing From Resume");
    results.missing_from_resume.forEach((s: string) => bullet(s));
    y += 4;
  }

  if (results.additional_tips?.length) {
    heading("Additional Tips");
    results.additional_tips.forEach((s: string) => bullet(s));
    y += 4;
  }

  if (results.tone_feedback) {
    heading("Tone Feedback");
    para(results.tone_feedback);
    y += 4;
  }

  if (results.full_optimized_resume) {
    heading("Full Optimized Resume");
    para(results.full_optimized_resume);
  }

  // Footer
  const tp = doc.getNumberOfPages();
  for (let i = 1; i <= tp; i++) {
    doc.setPage(i);
    doc.setFillColor(...c.dark);
    doc.rect(0, 285, pw, 12, "F");
    doc.setFontSize(7);
    doc.setTextColor(180, 200, 220);
    doc.text("SkillMirror AI  |  Powered by Advanced AI  |  www.skillmirror.ai", 20, 291);
    doc.text(`Page ${i} of ${tp}`, pw - 35, 291);
  }

  doc.save("SkillMirror-Resume-Optimization-Report.pdf");
}

const PROGRESS_STEPS = [
  { pct: 10, msg: "Reading resume content..." },
  { pct: 20, msg: "Analyzing job description..." },
  { pct: 35, msg: "Identifying keyword gaps..." },
  { pct: 50, msg: "Rewriting summary..." },
  { pct: 65, msg: "Optimizing experience bullets..." },
  { pct: 80, msg: "Adding relevant keywords..." },
  { pct: 90, msg: "Polishing final output..." },
  { pct: 95, msg: "Almost done..." },
];

const DashboardRewriter = () => {
  const { profile } = useAuth();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    setProgress(0);
    setProgressMsg(PROGRESS_STEPS[0].msg);
    let step = 0;
    progressRef.current = setInterval(() => {
      step++;
      if (step < PROGRESS_STEPS.length) {
        setProgress(PROGRESS_STEPS[step].pct);
        setProgressMsg(PROGRESS_STEPS[step].msg);
      }
    }, 3500);
  };

  const stopProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
    setProgressMsg("Complete!");
  };

  useEffect(() => { return () => { if (progressRef.current) clearInterval(progressRef.current); }; }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

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

  const handleOptimize = async () => {
    if (!resumeText.trim()) { toast({ title: "Error", description: "Please upload or paste your resume", variant: "destructive" }); return; }
    if (!jobDescription.trim()) { toast({ title: "Error", description: "Please paste the job description", variant: "destructive" }); return; }

    setLoading(true);
    setResults(null);
    startProgress();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Error", description: "Please sign in first", variant: "destructive" }); return; }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewrite-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Optimization failed"); }
      const { results: r } = await resp.json();
      stopProgress();
      setResults(r);
      toast({ title: "Resume Optimized!", description: `Score improved from ${r.optimization_score?.before}% to ${r.optimization_score?.after}%` });

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("SkillMirror AI", { body: "Resume optimization is complete!" });
      }
    } catch (e: any) {
      stopProgress();
      console.error(e);
      toast({ title: "Optimization Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Text copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <PenTool className="h-5 w-5 text-primary" /> Resume Optimizer
      </h2>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
        <div>
          <Label className="flex items-center gap-1 mb-1"><FileText className="h-3 w-3" /> Upload Resume</Label>
          <div
            className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => document.getElementById("rewrite-upload")?.click()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); }}
            onDragOver={e => e.preventDefault()}
          >
            <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {fileName ? <span className="text-primary flex items-center justify-center gap-2"><FileText className="h-4 w-4" />{fileName}</span> : "Upload PDF resume or drag & drop"}
            </p>
            <input id="rewrite-upload" type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
          </div>
        </div>

        {!fileName && (
          <div>
            <Label className="text-xs text-muted-foreground">Or paste resume text</Label>
            <Textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste resume content..." className="mt-1 bg-background/50 min-h-[100px]" />
          </div>
        )}

        <div>
          <Label className="flex items-center gap-1"><FileText className="h-3 w-3" /> Paste Job Description</Label>
          <Textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the target job description here..." className="mt-1 bg-background/50 min-h-[120px]" />
        </div>

        <Button onClick={handleOptimize} disabled={loading} className="w-full btn-glow bg-primary text-primary-foreground h-11">
          {loading ? (
            <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" /> Optimizing...</span>
          ) : (
            <span className="flex items-center gap-2"><PenTool className="h-4 w-4" /> Optimize Resume for This Job</span>
          )}
        </Button>
      </motion.div>

      {/* Loading with progress */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center">
            <div className="text-center w-80">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 mx-auto mb-4">
                <Sparkles className="w-16 h-16 text-primary" />
              </motion.div>
              <Progress value={progress} className="h-2 mb-3" />
              <p className="text-sm font-medium text-primary">{progress}%</p>
              <motion.p key={progressMsg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground mt-1">{progressMsg}</motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {results.optimization_score && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-4 text-center">Optimization Score</h3>
              <div className="flex items-center justify-center gap-6">
                <ScoreCircle score={results.optimization_score.before} label="Before" color="hsl(var(--accent))" size={110} />
                <ArrowRight className="h-8 w-8 text-primary" />
                <ScoreCircle score={results.optimization_score.after} label="After" color="hsl(var(--neon-green))" size={110} />
              </div>
            </div>
          )}

          {results.optimized_summary && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Optimized Summary</h3>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(results.optimized_summary)}><Copy className="h-3 w-3" /></Button>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg">{results.optimized_summary}</p>
            </div>
          )}

          {results.optimized_skills?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3">Optimized Skills</h3>
              <div className="flex flex-wrap gap-2">{results.optimized_skills.map((s: string) => <Badge key={s} className="bg-neon-green/20 text-neon-green border-neon-green/30">{s}</Badge>)}</div>
            </div>
          )}

          {results.optimized_experience?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-4">Experience Rewrites</h3>
              <div className="space-y-4">
                {results.optimized_experience.map((item: any, i: number) => (
                  <div key={i} className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground line-through">{item.original}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-neon-green mt-0.5 shrink-0" />
                      <p className="text-sm">{item.optimized}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.added_keywords?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-neon-green" /> Added Keywords</h3>
              <div className="flex flex-wrap gap-2">{results.added_keywords.map((s: string) => <Badge key={s} className="bg-primary/20 text-primary border-primary/30">{s}</Badge>)}</div>
            </div>
          )}

          {results.removed_content?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3">Removed Content</h3>
              <ul className="space-y-2">{results.removed_content.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-accent">✗</span>{s}</li>)}</ul>
            </div>
          )}

          {results.additional_tips?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3">Additional Tips</h3>
              <ul className="space-y-2">{results.additional_tips.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">{s}</li>)}</ul>
            </div>
          )}

          {results.full_optimized_resume && (
            <div className="glass-card p-6 neon-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold gradient-text">Full Optimized Resume</h3>
                <Button size="sm" variant="outline" className="neon-border" onClick={() => copyToClipboard(results.full_optimized_resume)}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <div className="bg-muted/20 rounded-lg p-4 max-h-[400px] overflow-auto">
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{results.full_optimized_resume}</pre>
              </div>
            </div>
          )}

          {results.tone_feedback && (
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground"><span className="font-bold text-foreground">Tone: </span>{results.tone_feedback}</p>
            </div>
          )}

          {/* Whitespace notice */}
          <div className="glass-card p-4 bg-muted/20">
            <p className="text-xs text-muted-foreground text-center italic">
              Clean and normalize whitespace before rendering the PDF. Remove hidden characters and ensure proper UTF-8 formatting.
            </p>
          </div>

          {/* PDF Export */}
          <div className="text-center">
            <Button
              onClick={() => generateRewriterReport(results, profile?.display_name || "User", profile?.email || "")}
              size="lg"
              className="btn-glow bg-primary text-primary-foreground"
            >
              <Download className="h-4 w-4 mr-2" /> Download Optimization Report PDF
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardRewriter;
