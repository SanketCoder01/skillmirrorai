import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, CheckCircle, User, GraduationCap, MapPin, Linkedin, Github, Upload, FileText, Image, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SplineBackground from "@/components/SplineBackground";

// PDF.js for client-side text extraction
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const CURRENT_YEAR = new Date().getFullYear();
const GRADUATION_YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR + i);
const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", 
  "France", "Singapore", "Japan", "UAE", "Netherlands", "Other"
];

const RESEARCH_INTERESTS = [
  "Artificial Intelligence", "Machine Learning", "Data Science", "Cybersecurity",
  "Cloud Computing", "Blockchain", "IoT", "Web Development", "Mobile Development",
  "DevOps", "Computer Vision", "Natural Language Processing", "Robotics", "Other"
];

const CompleteProfile = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    university: "",
    course: "",
    prn: "",
    graduation_year: "",
    country: "",
    linkedin: "",
    github: "",
    research_interest: "",
    bio: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const { user, refreshProfile, generateSkillMirrorId } = useAuth();
  const navigate = useNavigate();

  // Calculate profile progress
  const calculateProgress = () => {
    const fields = [
      formData.full_name,
      formData.university,
      formData.course,
      formData.prn,
      formData.graduation_year,
      formData.country,
      formData.linkedin,
      formData.research_interest,
      formData.bio,
      avatarFile,
      resumeFile
    ];
    const filled = fields.filter(f => f && f.toString().trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.avatar_url) setAvatarPreview(profile.avatar_url);
      
      // Pre-fill if data exists
      if (profile) {
        setFormData(prev => ({
          ...prev,
          full_name: profile.full_name || "",
          university: profile.university || "",
          course: profile.course || "",
          country: profile.country || "",
          linkedin: profile.linkedin_url || "",
          research_interest: profile.research_interest || "",
          bio: profile.bio || "",
          prn: profile.prn || "",
        }));
      }

      setCheckingProfile(false);
    };

    checkProfile();
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Extract text from PDF client-side
  const extractPdfText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      return fullText.trim();
    } catch (error) {
      console.error("PDF extraction error:", error);
      return "";
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Avatar must be less than 5MB", variant: "destructive" });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Resume must be less than 10MB", variant: "destructive" });
        return;
      }
      if (file.type !== "application/pdf") {
        toast({ title: "Invalid file", description: "Please upload a PDF file", variant: "destructive" });
        return;
      }
      setResumeFile(file);
      // Extract text from PDF immediately
      const text = await extractPdfText(file);
      setResumeText(text);
      if (text) {
        toast({ title: "Resume loaded", description: `Extracted ${text.length} characters from resume` });
      } else {
        toast({ title: "Warning", description: "Could not extract text from PDF. Analysis may be limited.", variant: "destructive" });
      }
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    
    if (error) {
      console.error(`Upload error for ${bucket}:`, error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.university || !formData.course || 
        !formData.prn || !formData.graduation_year || !formData.country) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!resumeFile) {
      toast({
        title: "Resume Required",
        description: "Please upload your resume/CV to complete your profile. This is mandatory for resume analysis.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      let avatarUrl = null;
      let resumeUrl = null;

      // Upload avatar
      if (avatarFile && user) {
        setUploadProgress(20);
        const avatarPath = `${user.id}/avatar.${avatarFile.name.split('.').pop()}`;
        avatarUrl = await uploadFile(avatarFile, "avatars", avatarPath);
        if (!avatarUrl) {
          toast({ title: "Avatar upload failed", description: "Continuing without avatar...", variant: "destructive" });
        }
      }

      // Upload resume
      if (resumeFile && user) {
        setUploadProgress(40);
        const resumePath = `${user.id}/resume.pdf`;
        resumeUrl = await uploadFile(resumeFile, "resumes", resumePath);
        if (!resumeUrl) {
          toast({ title: "Resume upload failed", description: "Continuing without resume...", variant: "destructive" });
        }
      }

      setUploadProgress(60);

      // Update profile in database
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user!.id,
          full_name: formData.full_name,
          email: user!.email,
          university: formData.university,
          course: formData.course,
          prn: formData.prn,
          country: formData.country,
          linkedin_url: formData.linkedin || null,
          research_interest: formData.research_interest || null,
          bio: formData.bio || null,
          avatar_url: avatarUrl,
          resume_url: resumeUrl,
          resume_text: resumeText, // Store extracted text for fast analysis
          role: "student",
          profile_completed: true,
          verification_status: "profile_completed",
        }, { onConflict: "user_id" });

      if (profileError) throw profileError;

      // Also update students table
      const { error: studentError } = await supabase
        .from("students")
        .upsert({
          user_id: user!.id,
          full_name: formData.full_name,
          email: user!.email,
          university: formData.university,
          course: formData.course,
          prn: formData.prn,
          country: formData.country,
          linkedin_url: formData.linkedin || null,
          research_interest: formData.research_interest || null,
          bio: formData.bio || null,
          avatar_url: avatarUrl,
          resume_url: resumeUrl,
        }, { onConflict: "user_id" });

      if (studentError) console.error("Student table error:", studentError);

      setUploadProgress(100);

      // Ensure SkillMirror ID is generated once profile is marked completed
      await generateSkillMirrorId(user!.id);
      await refreshProfile();

      toast({
        title: "✅ Profile completed!",
        description: "Your profile has been saved. Analyzing your resume...",
      });

      // Trigger automatic resume analysis in background
      if (resumeUrl) {
        try {
          // Get session for auth token
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Use pre-extracted text if available, otherwise the function will fetch from URL
            const analysisPayload: any = {
              targetRole: formData.research_interest || undefined,
              location: formData.country,
            };
            
            if (resumeText && resumeText.length > 50) {
              // Send pre-extracted text (FAST path)
              analysisPayload.resumeText = resumeText;
            } else {
              // Send URL for server-side extraction (fallback)
              analysisPayload.resumeUrl = resumeUrl;
            }
            
            console.log("Triggering analysis with payload:", analysisPayload.resumeText ? "pre-extracted text" : "URL");
            
            // Call analyze-resume function
            fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify(analysisPayload),
            }).then(response => response.json())
              .then(data => console.log("Analysis response:", data))
              .catch(err => console.error("Background analysis error:", err));
          }
        } catch (analysisError) {
          console.error("Failed to start resume analysis:", analysisError);
          // Don't block navigation if analysis fails
        }
      } else {
        console.log("No resume URL, skipping analysis");
      }

      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Profile completion error:", error);
      toast({
        title: "Error completing profile",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SplineBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <div className="glass-card p-6 sm:p-8 w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="font-display text-xl font-bold gradient-text">SkillMirror AI</span>
            </div>
            <h1 className="font-display text-2xl font-bold">Complete Your Profile</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Fill in your details to get your unique SkillMirror ID
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Profile Completion</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress < 100 && (
              <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Complete profile to increase selection chances
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div 
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary transition-colors overflow-hidden"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Image className="h-6 w-6" />
                    <span className="text-xs mt-1">Upload</span>
                  </div>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">Click to upload profile picture (optional)</p>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Personal Information</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="mt-1 bg-background/50"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(v) => handleSelectChange("country", v)}>
                    <SelectTrigger className="mt-1 bg-background/50">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>Academic Information</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="university">University / Institution *</Label>
                  <Input
                    id="university"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    required
                    placeholder="MIT, Stanford, etc."
                    className="mt-1 bg-background/50"
                  />
                </div>
                <div>
                  <Label htmlFor="course">Course / Degree *</Label>
                  <Input
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                    placeholder="B.Tech, MSc, etc."
                    className="mt-1 bg-background/50"
                  />
                </div>
                <div>
                  <Label htmlFor="prn">PRN / Enrollment Number *</Label>
                  <Input
                    id="prn"
                    name="prn"
                    value={formData.prn}
                    onChange={handleChange}
                    required
                    placeholder="Your enrollment number"
                    className="mt-1 bg-background/50"
                  />
                </div>
                <div>
                  <Label htmlFor="graduation_year">Graduation Year *</Label>
                  <Select value={formData.graduation_year} onValueChange={(v) => handleSelectChange("graduation_year", v)}>
                    <SelectTrigger className="mt-1 bg-background/50">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADUATION_YEARS.map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Research & Bio */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Research & Bio</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="research_interest">Research Interest</Label>
                  <Select value={formData.research_interest} onValueChange={(v) => handleSelectChange("research_interest", v)}>
                    <SelectTrigger className="mt-1 bg-background/50">
                      <SelectValue placeholder="Select area of interest" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESEARCH_INTERESTS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="linkedin" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    <span>LinkedIn Profile</span>
                  </Label>
                  <Input
                    id="linkedin"
                    name="linkedin"
                    type="url"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="mt-1 bg-background/50"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Bio / About</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself, your goals, and achievements..."
                  className="mt-1 bg-background/50 min-h-[80px]"
                />
              </div>
            </div>

            {/* CV Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Resume / CV *</span>
                <span className="text-xs text-amber-500">(Required)</span>
              </div>
              
              <div 
                onClick={() => resumeInputRef.current?.click()}
                className="border-2 border-dashed border-primary/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors bg-primary/5"
              >
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeChange}
                  className="hidden"
                />
                {resumeFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                    <span>{resumeFile.name}</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">Click to upload your CV (PDF, max 10MB) *</p>
                    <p className="text-xs text-amber-500 mt-1">Resume is mandatory for profile completion</p>
                  </div>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">After completing your profile, you'll get:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Unique SkillMirror ID (SK_XXXXXX)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Visibility to Recruiters worldwide</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Real-time messaging with recruiters</span>
                </li>
              </ul>
            </div>

            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-glow bg-primary text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                "Complete Profile & Get My ID"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
