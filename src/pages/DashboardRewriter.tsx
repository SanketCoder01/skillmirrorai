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
import { generateRewriterReport, downloadResumePDF, downloadResumeDOCX } from "@/lib/pdf-generator";

const PROGRESS_STEPS = [
  { pct: 5, msg: "Initializing optimizer..." },
  { pct: 15, msg: "Reading resume content..." },
  { pct: 25, msg: "Analyzing job description..." },
  { pct: 35, msg: "Extracting keywords from JD..." },
  { pct: 45, msg: "Identifying skill gaps..." },
  { pct: 55, msg: "Rewriting professional summary..." },
  { pct: 65, msg: "Optimizing experience section..." },
  { pct: 75, msg: "Enhancing project descriptions..." },
  { pct: 85, msg: "Reorganizing skills section..." },
  { pct: 92, msg: "Generating final resume..." },
  { pct: 98, msg: "Finalizing output..." },
];

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, delay: i * 0.08 },
});

const DashboardRewriter = () => {
  const { profile } = useAuth();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const smoothProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProgress = () => {
    setProgress(0);
    setProgressMsg(PROGRESS_STEPS[0].msg);
    let step = 0;
    let currentProgress = 0;
    
    // Clear any existing intervals
    if (progressRef.current) clearInterval(progressRef.current);
    if (smoothProgressRef.current) clearInterval(smoothProgressRef.current);
    
    // Smooth progress animation - increment by 1% every 100ms
    smoothProgressRef.current = setInterval(() => {
      currentProgress += 1;
      if (step < PROGRESS_STEPS.length && currentProgress >= PROGRESS_STEPS[step].pct) {
        setProgressMsg(PROGRESS_STEPS[step].msg);
        step++;
      }
      if (currentProgress <= 95) {
        setProgress(currentProgress);
      }
    }, 100);
    
    // Step-based progress for messages
    progressRef.current = setInterval(() => {
      if (step < PROGRESS_STEPS.length) {
        step++;
      }
    }, 2500);
  };

  const stopProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (smoothProgressRef.current) clearInterval(smoothProgressRef.current);
    
    // Animate to 100%
    let finalProgress = progress;
    const finalInterval = setInterval(() => {
      finalProgress += 2;
      if (finalProgress >= 100) {
        setProgress(100);
        setProgressMsg("Complete!");
        clearInterval(finalInterval);
      } else {
        setProgress(finalProgress);
      }
    }, 30);
  };

  useEffect(() => { 
    return () => { 
      if (progressRef.current) clearInterval(progressRef.current); 
      if (smoothProgressRef.current) clearInterval(smoothProgressRef.current); 
    }; 
  }, []);

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
      <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="font-display text-xl font-bold flex items-center gap-2">
        <PenTool className="h-5 w-5 text-primary" /> Resume Optimizer
      </motion.h2>

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

      {/* Loading */}
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
          {/* ATS Match Score */}
          {results.ats_match_score && (
            <motion.div {...fadeUp(0)} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg">ATS Match Score</h3>
                <div className="text-3xl font-bold text-primary">{results.ats_match_score}%</div>
              </div>
              <Progress value={results.ats_match_score} className="h-3" />
              {results.interview_strength_analysis?.interview_probability && (
                <p className="text-sm text-muted-foreground mt-3">
                  Interview Probability: <span className="text-neon-green font-semibold">{results.interview_strength_analysis.interview_probability}%</span>
                </p>
              )}
            </motion.div>
          )}

          {/* Keyword Match Breakdown */}
          {results.keyword_match_breakdown && (
            <motion.div {...fadeUp(1)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-4">Keyword Match Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.keyword_match_breakdown.core_skills_matched?.length > 0 && (
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-2">Core Skills Matched</p>
                    <div className="flex flex-wrap gap-2">
                      {results.keyword_match_breakdown.core_skills_matched.map((s: string) => (
                        <Badge key={s} className="bg-neon-green/10 text-neon-green border-neon-green/20">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {results.keyword_match_breakdown.secondary_skills_matched?.length > 0 && (
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-2">Secondary Skills Matched</p>
                    <div className="flex flex-wrap gap-2">
                      {results.keyword_match_breakdown.secondary_skills_matched.map((s: string) => (
                        <Badge key={s} className="bg-primary/10 text-primary border-primary/20">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {results.keyword_match_breakdown.tools_matched?.length > 0 && (
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-2">Tools & Frameworks</p>
                    <div className="flex flex-wrap gap-2">
                      {results.keyword_match_breakdown.tools_matched.map((s: string) => (
                        <Badge key={s} className="bg-blue-500/10 text-blue-400 border-blue-500/20">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {results.keyword_match_breakdown.keywords_integrated?.length > 0 && (
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-2">Keywords Integrated</p>
                    <div className="flex flex-wrap gap-2">
                      {results.keyword_match_breakdown.keywords_integrated.map((s: string) => (
                        <Badge key={s} className="bg-purple-500/10 text-purple-400 border-purple-500/20">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Gaps Identified */}
          {results.gaps_identified && (
            <motion.div {...fadeUp(2)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-4">Gap Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.gaps_identified.matched_skills?.length > 0 && (
                  <div className="bg-neon-green/5 rounded-lg p-4 border border-neon-green/20">
                    <p className="text-sm font-semibold text-neon-green mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Matched Skills
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {results.gaps_identified.matched_skills.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {results.gaps_identified.partially_matched_skills?.length > 0 && (
                  <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/20">
                    <p className="text-sm font-semibold text-amber-500 mb-2">Partially Matched</p>
                    <ul className="space-y-1">
                      {results.gaps_identified.partially_matched_skills.map((item: any, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{item.skill}</span> - {item.gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.gaps_identified.missing_but_learnable?.length > 0 && (
                  <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
                    <p className="text-sm font-semibold text-blue-400 mb-2">Missing But Learnable</p>
                    <div className="flex flex-wrap gap-1">
                      {results.gaps_identified.missing_but_learnable.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs border-blue-500/30">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {results.gaps_identified.completely_missing_critical?.length > 0 && (
                  <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/20">
                    <p className="text-sm font-semibold text-red-400 mb-2">Critical Missing</p>
                    <div className="flex flex-wrap gap-1">
                      {results.gaps_identified.completely_missing_critical.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs border-red-500/30 text-red-400">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Optimized Summary */}
          {results.optimized_summary && (
            <motion.div {...fadeUp(3)} className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Optimized Summary</h3>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(results.optimized_summary)}><Copy className="h-3 w-3" /></Button>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg leading-relaxed">{results.optimized_summary}</p>
            </motion.div>
          )}

          {/* Optimized Experience */}
          {results.optimized_experience?.length > 0 && (
            <motion.div {...fadeUp(4)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Optimized Experience</h3>
              <div className="space-y-6">
                {results.optimized_experience.map((item: any, i: number) => (
                  <div key={i} className="border-l-2 border-primary/30 pl-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                      <h4 className="font-semibold text-foreground">{item.role}</h4>
                      <span className="text-xs text-muted-foreground">{item.duration}</span>
                    </div>
                    <p className="text-sm text-primary font-medium mb-2">{item.company}</p>
                    <ul className="space-y-2">
                      {item.bullets?.map((bullet: string, j: number) => (
                        <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-neon-green mt-0.5 shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Optimized Projects */}
          {results.optimized_projects?.length > 0 && (
            <motion.div {...fadeUp(5)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Optimized Projects</h3>
              <div className="space-y-6">
                {results.optimized_projects.map((item: any, i: number) => (
                  <div key={i} className="bg-muted/10 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="font-semibold text-foreground">{item.name}</h4>
                      {item.tech_stack?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tech_stack.map((t: string) => (
                            <Badge key={t} className="text-xs bg-primary/10 text-primary">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {item.bullets?.map((bullet: string, j: number) => (
                        <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-neon-green mt-0.5 shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Optimized Skills by Category */}
          {results.optimized_skills && Object.keys(results.optimized_skills).length > 0 && (
            <motion.div {...fadeUp(6)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-4">Optimized Skills</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(results.optimized_skills).map(([category, skills]: [string, any]) => (
                  skills?.length > 0 && (
                    <div key={category} className="bg-muted/10 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-primary mb-2">{category.replace(/_/g, ' ')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((s: string) => (
                          <Badge key={s} className="bg-neon-green/10 text-neon-green border-neon-green/20 text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </motion.div>
          )}

          {/* Interview Strength Analysis */}
          {results.interview_strength_analysis && (
            <motion.div {...fadeUp(7)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-4">Interview Strength Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neon-green/5 rounded-lg p-4 border border-neon-green/20">
                  <p className="text-sm font-semibold text-neon-green mb-2">Strengths</p>
                  <ul className="space-y-1">
                    {results.interview_strength_analysis.strengths?.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-neon-green mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/20">
                  <p className="text-sm font-semibold text-amber-500 mb-2">Areas to Improve</p>
                  <ul className="space-y-1">
                    {results.interview_strength_analysis.weaknesses?.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted/10 rounded-lg flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Impression:</span>
                <Badge className={`${
                  results.interview_strength_analysis.overall_impression === 'Strong' ? 'bg-neon-green/20 text-neon-green' :
                  results.interview_strength_analysis.overall_impression === 'Moderate' ? 'bg-amber-500/20 text-amber-500' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {results.interview_strength_analysis.overall_impression}
                </Badge>
              </div>
            </motion.div>
          )}

          {/* Improvement Suggestions */}
          {results.improvement_suggestions?.length > 0 && (
            <motion.div {...fadeUp(8)} className="glass-card p-6">
              <h3 className="font-display font-bold mb-3">Suggestions to Improve Selection Chances</h3>
              <ul className="space-y-2">
                {results.improvement_suggestions.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg flex items-start gap-2">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Full Optimized Resume - Resume Style Display */}
          {results.full_optimized_resume && (
            <motion.div {...fadeUp(9)} className="glass-card p-6 neon-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="font-display font-bold gradient-text text-lg">Full Optimized Resume</h3>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="neon-border" onClick={() => copyToClipboard(results.full_optimized_resume)}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <Button size="sm" variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20" onClick={() => downloadResumeDOCX(results.full_optimized_resume, "Optimized_Resume")}>
                    <Download className="h-3 w-3 mr-1" /> DOCX
                  </Button>
                </div>
              </div>
              
              {/* Resume Style Display */}
              <div className="bg-white rounded-lg p-6 sm:p-8 text-gray-900 shadow-lg">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed" style={{ fontFamily: "'Segoe UI', 'Roboto', sans-serif" }}>
                  {results.full_optimized_resume}
                </pre>
              </div>
            </motion.div>
          )}

          {/* PDF Export */}
          <motion.div {...fadeUp(10)} className="text-center">
            <Button
              onClick={() => generateRewriterReport(results, profile?.display_name || "User", profile?.email || "")}
              size="lg"
              className="btn-glow bg-primary text-primary-foreground"
            >
              <Download className="h-4 w-4 mr-2" /> Download Full Report PDF
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardRewriter;
