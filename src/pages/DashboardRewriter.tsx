import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Sparkles, PenTool, ArrowRight, Copy, Download, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScoreCircle } from "@/components/dashboard/ScoreCircle";

const DashboardRewriter = () => {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
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

  const handleOptimize = async () => {
    if (!resumeText.trim()) { toast({ title: "Error", description: "Please upload or paste your resume", variant: "destructive" }); return; }
    if (!jobDescription.trim()) { toast({ title: "Error", description: "Please paste the job description", variant: "destructive" }); return; }

    setLoading(true);
    setResults(null);
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
      setResults(r);
      toast({ title: "Resume Optimized!", description: `Score improved from ${r.optimization_score?.before}% to ${r.optimization_score?.after}%` });
    } catch (e: any) {
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
        {/* Upload */}
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

        {/* Job Description */}
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

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center">
            <div className="text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 mx-auto mb-4">
                <Sparkles className="w-16 h-16 text-primary" />
              </motion.div>
              <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="text-lg font-display gradient-text">AI is rewriting your resume...</motion.p>
              <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Score improvement */}
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

          {/* Optimized summary */}
          {results.optimized_summary && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Optimized Summary</h3>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(results.optimized_summary)}><Copy className="h-3 w-3" /></Button>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg">{results.optimized_summary}</p>
            </div>
          )}

          {/* Optimized skills */}
          {results.optimized_skills?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3">Optimized Skills</h3>
              <div className="flex flex-wrap gap-2">{results.optimized_skills.map((s: string) => <Badge key={s} className="bg-neon-green/20 text-neon-green border-neon-green/30">{s}</Badge>)}</div>
            </div>
          )}

          {/* Experience rewrites */}
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

          {/* Added keywords */}
          {results.added_keywords?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-neon-green" /> Added Keywords</h3>
              <div className="flex flex-wrap gap-2">{results.added_keywords.map((s: string) => <Badge key={s} className="bg-primary/20 text-primary border-primary/30">{s}</Badge>)}</div>
            </div>
          )}

          {/* Removed content */}
          {results.removed_content?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3">Removed Content</h3>
              <ul className="space-y-2">{results.removed_content.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-accent">✗</span>{s}</li>)}</ul>
            </div>
          )}

          {/* Tips */}
          {results.additional_tips?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold mb-3">Additional Tips</h3>
              <ul className="space-y-2">{results.additional_tips.map((s: string, i: number) => <li key={i} className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">{s}</li>)}</ul>
            </div>
          )}

          {/* Full resume */}
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

          {/* Tone feedback */}
          {results.tone_feedback && (
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground"><span className="font-bold text-foreground">Tone: </span>{results.tone_feedback}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardRewriter;
