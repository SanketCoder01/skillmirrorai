import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Sparkles, ShieldCheck, CheckCircle, XCircle, AlertTriangle, Trash2 } from "lucide-react";
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

const DashboardATS = () => {
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

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
      setResults(r);
      toast({ title: "ATS Analysis Complete!", description: `ATS Score: ${r.ats_score}%` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" /> ATS Score Analyzer
      </h2>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
        {/* Role selection */}
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

        {/* Upload */}
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
            <div className="text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 mx-auto mb-4">
                <Sparkles className="w-16 h-16 text-primary" />
              </motion.div>
              <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="text-lg font-display gradient-text">Scanning resume against ATS systems...</motion.p>
              <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Score */}
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <ScoreCircle score={results.ats_score} label="ATS Score" color="hsl(var(--neon-cyan))" size={140} />
              {results.section_scores && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(results.section_scores).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                      <Progress value={val as number} className="h-2 mt-1" />
                      <p className="text-xs font-bold mt-1">{val as number}%</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Keyword density */}
          {results.keyword_density && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3">Keyword Density</h3>
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Present: {results.keyword_density.present}% / Optimal: {results.keyword_density.optimal}%</p>
                  <Progress value={results.keyword_density.present} className="h-3" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{results.keyword_density.suggestion}</p>
            </div>
          )}

          {/* Matching skills */}
          {results.matching_skills?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-neon-green" /> Matching Keywords</h3>
              <div className="flex flex-wrap gap-2">{results.matching_skills.map((s: string) => <Badge key={s} className="bg-neon-green/20 text-neon-green border-neon-green/30">{s}</Badge>)}</div>
            </div>
          )}

          {/* Missing skills */}
          {results.missing_skills?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><XCircle className="h-4 w-4 text-accent" /> Missing Keywords</h3>
              <div className="flex flex-wrap gap-2">{results.missing_skills.map((s: string) => <Badge key={s} className="bg-accent/20 text-accent border-accent/30">{s}</Badge>)}</div>
            </div>
          )}

          {/* Remove suggestions */}
          {results.remove_suggestions?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Consider Removing</h3>
              <ul className="space-y-2">{results.remove_suggestions.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-destructive">✗</span>{s}</li>)}</ul>
            </div>
          )}

          {/* Weak sections */}
          {results.weak_sections?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-secondary" /> Weak Sections</h3>
              <ul className="space-y-2">{results.weak_sections.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground">⚠ {s}</li>)}</ul>
            </div>
          )}

          {/* Improvement tips */}
          {results.improvement_tips?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Improvement Tips</h3>
              <ul className="space-y-2">{results.improvement_tips.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">{s}</li>)}</ul>
            </div>
          )}

          {/* Summary feedback */}
          {results.summary_feedback && (
            <div className="glass-card p-6 neon-border">
              <h3 className="font-display font-bold mb-2 gradient-text">Overall Feedback</h3>
              <p className="text-sm text-muted-foreground">{results.summary_feedback}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardATS;
