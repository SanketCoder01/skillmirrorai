import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Mail, MapPin, GraduationCap, Calendar, Link as LinkIcon,
  FileText, Save, Loader2, Github, Linkedin, Briefcase,
  Award, Shield, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import AvatarUpload from "@/components/AvatarUpload";

interface ProfileData {
  full_name: string | null;
  email: string | null;
  university: string | null;
  course: string | null;
  prn: string | null;
  graduation_year: number | null;
  country: string | null;
  linkedin_url: string | null;
  github: string | null;
  research_interest: string | null;
  bio: string | null;
  avatar_url: string | null;
  resume_url: string | null;
  skillmirror_id: string | null;
  verification_status: string | null;
  candidate_score: number | null;
  risk_score: number | null;
  skill_authenticity_score: number | null;
}

const StudentProfile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    university: "",
    course: "",
    prn: "",
    graduation_year: "",
    country: "",
    linkedin_url: "",
    github: "",
    research_interest: "",
    bio: "",
  });

  // Use auth profile data immediately while loading full profile
  useEffect(() => {
    if (authProfile) {
      setFormData({
        full_name: authProfile.full_name || "",
        university: authProfile.university || "",
        course: authProfile.course || "",
        prn: "",
        graduation_year: "",
        country: authProfile.country || "",
        linkedin_url: "",
        github: "",
        research_interest: "",
        bio: "",
      });
    }
  }, [authProfile]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          university: data.university || "",
          course: data.course || "",
          prn: data.prn || "",
          graduation_year: data.graduation_year?.toString() || "",
          country: data.country || "",
          linkedin_url: data.linkedin_url || "",
          github: data.github || "",
          research_interest: data.research_interest || "",
          bio: data.bio || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({ title: "Failed to load profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({ title: "Avatar updated successfully" });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({ title: "Failed to upload avatar", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Resume must be less than 10MB", variant: "destructive" });
      return;
    }

    setUploadingResume(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/resume.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, resume_url: publicUrl } : null);
      toast({ title: "Resume uploaded successfully" });
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast({ title: "Failed to upload resume", variant: "destructive" });
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          university: formData.university || null,
          course: formData.course || null,
          prn: formData.prn || null,
          graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
          country: formData.country || null,
          linkedin_url: formData.linkedin_url || null,
          github: formData.github || null,
          research_interest: formData.research_interest || null,
          bio: formData.bio || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Profile updated successfully" });
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getVerificationBadge = (status: string | null) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500"><Shield className="h-3 w-3 mr-1" /> Verified</Badge>;
      case "test_completed":
        return <Badge className="bg-blue-500"><Award className="h-3 w-3 mr-1" /> Tested</Badge>;
      default:
        return <Badge variant="outline">Profile Completed</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Card */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <AvatarUpload
                currentAvatarUrl={profile?.avatar_url}
                userName={profile?.full_name || "Student"}
                onUploadComplete={(url) => {
                  setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
                }}
                refreshProfile={refreshProfile}
                size="lg"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{profile?.full_name || "Student"}</h2>
                {getVerificationBadge(profile?.verification_status)}
              </div>
              
              {profile?.skillmirror_id && (
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="font-mono text-sm text-primary">{profile.skillmirror_id}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                {profile?.university && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{profile.university}</span>
                  </div>
                )}
                {profile?.course && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{profile.course}</span>
                  </div>
                )}
                {profile?.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.country}</span>
                  </div>
                )}
                {profile?.graduation_year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Class of {profile.graduation_year}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <p className="text-2xl font-bold text-primary">{profile?.candidate_score || 0}%</p>
              <p className="text-xs text-muted-foreground">Candidate Score</p>
              <Progress value={profile?.candidate_score || 0} className="h-1 mt-2" />
            </div>
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <p className="text-2xl font-bold">{profile?.risk_score || 0}%</p>
              <p className="text-xs text-muted-foreground">Risk Score</p>
              <Progress value={profile?.risk_score || 0} className="h-1 mt-2" />
            </div>
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <p className="text-2xl font-bold text-green-500">{profile?.skill_authenticity_score || 0}%</p>
              <p className="text-xs text-muted-foreground">Authenticity</p>
              <Progress value={profile?.skill_authenticity_score || 0} className="h-1 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Your full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Your country"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Academic Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">University</label>
                  <Input
                    value={formData.university}
                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                    placeholder="Your university"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Course</label>
                  <Input
                    value={formData.course}
                    onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                    placeholder="Your course/major"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">PRN</label>
                  <Input
                    value={formData.prn}
                    onChange={(e) => setFormData(prev => ({ ...prev, prn: e.target.value }))}
                    placeholder="University PRN"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Graduation Year</label>
                  <Input
                    type="number"
                    value={formData.graduation_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, graduation_year: e.target.value }))}
                    placeholder="2025"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Professional Links */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Professional Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Linkedin className="h-4 w-4" /> LinkedIn
                  </label>
                  <Input
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Github className="h-4 w-4" /> GitHub
                  </label>
                  <Input
                    value={formData.github}
                    onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                    placeholder="https://github.com/yourusername"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Additional Information</h3>
              <div>
                <label className="text-sm font-medium">Research Interest</label>
                <Input
                  value={formData.research_interest}
                  onChange={(e) => setFormData(prev => ({ ...prev, research_interest: e.target.value }))}
                  placeholder="Your research interests"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Resume Upload */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Resume</h3>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {profile?.resume_url ? "Update Resume" : "Upload Resume"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={uploadingResume}
                  />
                </label>
                {uploadingResume && <Loader2 className="h-4 w-4 animate-spin" />}
                {profile?.resume_url && (
                  <Button type="button" variant="ghost" size="sm" asChild>
                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                      View Current Resume
                    </a>
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">PDF format, max 10MB</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfile;
