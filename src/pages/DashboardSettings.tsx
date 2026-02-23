import { useState, useEffect } from "react";
import { Settings, User, Trash2, LogOut, Mail, MapPin, GraduationCap, Award, Shield, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FullProfile {
  full_name: string | null;
  email: string | null;
  university: string | null;
  course: string | null;
  country: string | null;
  skillmirror_id: string | null;
  verification_status: string | null;
  candidate_score: number | null;
  risk_score: number | null;
  skill_authenticity_score: number | null;
  linkedin_url: string | null;
  github: string | null;
  graduation_year: number | null;
  prn: string | null;
  bio: string | null;
  research_interest: string | null;
  avatar_url: string | null;
  resume_url: string | null;
}

const DashboardSettings = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [fullProfile, setFullProfile] = useState<FullProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullProfile({
        full_name: profile.full_name || null,
        email: profile.email || user?.email || null,
        university: profile.university || null,
        course: profile.course || null,
        country: profile.country || null,
        skillmirror_id: profile.skillmirror_id || null,
        verification_status: profile.verification_status || null,
        candidate_score: profile.candidate_score || null,
        risk_score: profile.risk_score || null,
        skill_authenticity_score: profile.skill_authenticity_score || null,
        linkedin_url: profile.linkedin_url || null,
        github: profile.github || null,
        graduation_year: profile.graduation_year || null,
        prn: profile.prn || null,
        bio: profile.bio || null,
        research_interest: profile.research_interest || null,
        avatar_url: profile.avatar_url || null,
        resume_url: profile.resume_url || null,
      });
    }
  }, [profile, user]);

  const handleUpdateProfile = async () => {
    if (!user || !fullProfile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ 
        full_name: fullProfile.full_name,
        university: fullProfile.university,
        course: fullProfile.course,
        country: fullProfile.country,
        updated_at: new Date().toISOString() 
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } else {
      await refreshProfile();
      setEditing(false);
      toast({ title: "Updated", description: "Profile updated successfully." });
    }
  };

  const handleClearHistory = async () => {
    if (!user || !confirm("Are you sure you want to delete all your analysis history?")) return;
    const { error } = await supabase.from("analyses").delete().eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: "Failed to clear history", variant: "destructive" });
    } else {
      localStorage.setItem("history-cleared", Date.now().toString());
      toast({ title: "Cleared", description: "All analysis history deleted." });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleInputChange = (field: keyof FullProfile, value: string) => {
    setFullProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" /> Settings
      </h2>

      {/* Profile Details Card */}
      <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Profile Details
          </CardTitle>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleUpdateProfile} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unique ID Banner */}
          {fullProfile?.skillmirror_id && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Your Unique SkillMirror ID</p>
                  <p className="text-lg font-mono font-bold text-primary">{fullProfile.skillmirror_id}</p>
                </div>
              </div>
              <Badge className={fullProfile.verification_status === "verified" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}>
                {fullProfile.verification_status === "verified" ? "Verified" : "Pending"}
              </Badge>
            </div>
          )}

          {/* Personal Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Full Name
              </Label>
              {editing ? (
                <Input value={fullProfile?.full_name || ""} onChange={e => handleInputChange("full_name", e.target.value)} className="mt-1 bg-background/50" />
              ) : (
                <p className="mt-1 font-medium">{fullProfile?.full_name || "-"}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </Label>
              <p className="mt-1 font-medium text-muted-foreground">{fullProfile?.email || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Country
              </Label>
              {editing ? (
                <Input value={fullProfile?.country || ""} onChange={e => handleInputChange("country", e.target.value)} className="mt-1 bg-background/50" />
              ) : (
                <p className="mt-1 font-medium">{fullProfile?.country || "-"}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Graduation Year
              </Label>
              <p className="mt-1 font-medium">{fullProfile?.graduation_year || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">PRN / Enrollment Number</Label>
                <p className="mt-1 font-medium">{fullProfile?.prn || "-"}</p>
            </div>
          </div>

          {/* Academic Information */}
          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
              <GraduationCap className="h-4 w-4 text-primary" />
              Academic Information
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">University / College</Label>
                {editing ? (
                  <Input value={fullProfile?.university || ""} onChange={e => handleInputChange("university", e.target.value)} className="mt-1 bg-background/50" />
                ) : (
                  <p className="mt-1 font-medium">{fullProfile?.university || "-"}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Course / Department</Label>
                {editing ? (
                  <Input value={fullProfile?.course || ""} onChange={e => handleInputChange("course", e.target.value)} className="mt-1 bg-background/50" />
                ) : (
                  <p className="mt-1 font-medium">{fullProfile?.course || "-"}</p>
                )}
              </div>
                          </div>
          </div>

          {/* Scores Section */}
          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-primary" />
              Verification Scores
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Candidate Score</p>
                <p className="text-xl font-bold text-primary">{fullProfile?.candidate_score ? `${fullProfile.candidate_score}%` : "-"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Risk Score</p>
                <p className="text-xl font-bold text-yellow-500">{fullProfile?.risk_score !== null ? `${fullProfile.risk_score}%` : "-"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Authenticity</p>
                <p className="text-xl font-bold text-green-500">{fullProfile?.skill_authenticity_score ? `${fullProfile.skill_authenticity_score}%` : "-"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-xl font-bold">{fullProfile?.verification_status || "Pending"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border border-destructive/20 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-destructive text-lg">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleClearHistory}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear All History
          </Button>
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSettings;
