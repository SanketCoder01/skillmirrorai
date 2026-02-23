import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, FileText, CheckCircle, AlertTriangle, Shield, 
  Loader2, Sparkles, Download, Eye, X, FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as pdfjsLib from "pdfjs-dist";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface VerificationResult {
  overall_score: number;
  authenticity_score: number;
  formatting_score: number;
  content_quality_score: number;
  skills_detected: string[];
  experience_summary: {
    total_years: number;
    companies: string[];
    roles: string[];
  };
  education: {
    degrees: string[];
    institutions: string[];
  };
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  red_flags: string[];
  strengths: string[];
  recommendations: string[];
  is_verified: boolean;
  verification_level: "verified" | "partially_verified" | "needs_review";
}

const DashboardVerifier = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<VerificationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }
    
    return fullText.trim();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFile(files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    setResults(null);

    try {
      const text = await extractTextFromPDF(selectedFile);
      setParsedText(text);
      
      if (text.length < 100) {
        toast({
          title: "Resume too short",
          description: "Could not extract enough text from the PDF. Please ensure it's not a scanned image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("PDF extraction error:", error);
      toast({
        title: "PDF extraction failed",
        description: "Could not read the PDF. Please try another file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const uploadResumeToStorage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file);
    
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleVerify = async () => {
    if (!parsedText || !user) return;

    setLoading(true);
    setResults(null);

    try {
      // Upload to storage
      const fileUrl = await uploadResumeToStorage(file!);

      // Call verification function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Please sign in first", variant: "destructive" });
        return;
      }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          resumeText: parsedText,
          userId: user.id,
          fileName: file?.name,
          fileUrl,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Verification failed");
      }

      const { results: verificationResults } = await resp.json();
      setResults(verificationResults);

      // Save to resumes table
      await supabase.from("resumes").insert({
        user_id: user.id,
        file_name: file?.name || "resume.pdf",
        file_url: fileUrl,
        parsed_text: parsedText,
        skills_detected: verificationResults.skills_detected,
        experience: verificationResults.experience_summary,
        education: verificationResults.education,
        projects: verificationResults.projects,
        analysis_result: verificationResults,
        is_verified: verificationResults.is_verified,
        verification_score: verificationResults.overall_score,
      });

      toast({
        title: "Verification Complete!",
        description: `Overall Score: ${verificationResults.overall_score}%`,
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Verification Failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setParsedText("");
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case "verified":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
      case "partially_verified":
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Partially Verified</Badge>;
      default:
        return <Badge className="bg-red-500"><AlertTriangle className="h-3 w-3 mr-1" /> Needs Review</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Resume Global Verifier</h1>
          <p className="text-muted-foreground">Upload your resume for AI-powered verification and analysis</p>
        </div>
        {results && (
          <Button variant="outline" onClick={resetUpload}>
            <X className="h-4 w-4 mr-2" />
            Clear & Upload New
          </Button>
        )}
      </div>

      {/* Upload Section */}
      {!results && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Extracting text from PDF...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 bg-primary/10 rounded-lg p-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB • {parsedText.length} characters extracted
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetUpload}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleVerify}
                    disabled={loading || parsedText.length < 100}
                    className="btn-glow"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Verify Resume
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Drag and drop your resume here</p>
                    <p className="text-sm text-muted-foreground">or click to browse (PDF only, max 5MB)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="resume-upload"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Select PDF File
                    </label>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Overlay */}
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
                AI is verifying your resume...
              </motion.p>
              <p className="text-sm text-muted-foreground mt-2">Analyzing authenticity, skills, and content quality</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Verification Result
                </CardTitle>
                {getVerificationBadge(results.verification_level)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(results.overall_score)}`}>
                    {results.overall_score}%
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(results.authenticity_score)}`}>
                    {results.authenticity_score}%
                  </div>
                  <p className="text-sm text-muted-foreground">Authenticity</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(results.formatting_score)}`}>
                    {results.formatting_score}%
                  </div>
                  <p className="text-sm text-muted-foreground">Formatting</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(results.content_quality_score)}`}>
                    {results.content_quality_score}%
                  </div>
                  <p className="text-sm text-muted-foreground">Content Quality</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Detected */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Skills Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {results.skills_detected.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Experience & Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Experience Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Experience</p>
                  <p className="font-medium">{results.experience_summary.total_years} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Companies</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {results.experience_summary.companies.map((c, idx) => (
                      <Badge key={idx} variant="outline">{c}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Roles</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {results.experience_summary.roles.map((r, idx) => (
                      <Badge key={idx} variant="outline">{r}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Degrees</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {results.education.degrees.map((d, idx) => (
                      <Badge key={idx} variant="outline">{d}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Institutions</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {results.education.institutions.map((i, idx) => (
                      <Badge key={idx} variant="outline">{i}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects */}
          {results.projects.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Projects Detected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.projects.map((project, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.technologies.map((tech, tIdx) => (
                          <Badge key={tIdx} variant="secondary" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths & Red Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                  Red Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.red_flags.length > 0 ? (
                  <ul className="space-y-2">
                    {results.red_flags.map((r, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No red flags detected</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.recommendations.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold">{idx + 1}.</span>
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardVerifier;
