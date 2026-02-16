import { useState, useCallback } from "react";
import { Upload, FileText, MapPin, Briefcase, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

interface AnalysisCardProps {
  onAnalyze: (data: { resumeText: string; jobDescription: string; targetRole: string; location: string }) => void;
  loading: boolean;
}

export function AnalysisCard({ onAnalyze, loading }: AnalysisCardProps) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [location, setLocation] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleSubmit = () => {
    if (!resumeText.trim()) {
      alert("Please upload a resume or paste resume text");
      return;
    }
    onAnalyze({ resumeText, jobDescription, targetRole, location });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        Resume Analysis Engine
      </h2>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center mb-4 hover:border-primary/40 transition-colors cursor-pointer"
        onClick={() => document.getElementById("resume-upload")?.click()}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {fileName ? (
            <span className="text-primary flex items-center justify-center gap-2"><FileText className="h-4 w-4" />{fileName}</span>
          ) : (
            "Drag & drop your PDF resume here, or click to browse"
          )}
        </p>
        <input id="resume-upload" type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
      </div>

      {/* Resume text fallback */}
      {!fileName && (
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground">Or paste resume text</Label>
          <Textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your resume content here..." className="mt-1 bg-background/50 min-h-[100px]" />
        </div>
      )}

      {/* Job description */}
      <div className="mb-4">
        <Label className="flex items-center gap-1"><FileText className="h-3 w-3" /> Job Description</Label>
        <Textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the target job description..." className="mt-1 bg-background/50 min-h-[80px]" />
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Target Role (optional)</Label>
          <Input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Senior Frontend Developer" className="mt-1 bg-background/50" />
        </div>
        <div>
          <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Location (optional)</Label>
          <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA" className="mt-1 bg-background/50" />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full btn-glow bg-primary text-primary-foreground text-base h-12">
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
            AI is analyzing...
          </span>
        ) : (
          <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Run AI Career Analysis</span>
        )}
      </Button>
    </motion.div>
  );
}
