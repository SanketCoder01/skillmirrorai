import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, Mail, MapPin, GraduationCap, Calendar, Award, 
  Shield, TrendingUp, Edit2, Save, X, Linkedin, Github,
  FileText, Trophy, CheckCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProfileData {
  full_name: string;
  email: string;
  university: string;
  course: string;
  country: string;
  skillmirror_id: string;
  verification_status: string;
  candidate_score: number | null;
  risk_score: number | null;
  skill_authenticity_score: number | null;
  growth_potential_score: number | null;
  linkedin_url: string | null;
  github_url: string | null;
  graduation_year: string | null;
  prn_number: string | null;
}

const DashboardProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    email: "",
    university: "",
    course: "",
    country: "",
    skillmirror_id: "",
    verification_status: "pending",
    candidate_score: null,
    risk_score: null,
    skill_authenticity_score: null,
    growth_potential_score: null,
    linkedin_url: null,
    github_url: null,
    graduation_year: null,
    prn_number: null,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        university: profile.university || "",
        course: profile.course || "",
        country: profile.country || "",
        skillmirror_id: profile.skillmirror_id || "",
        verification_status: profile.verification_status || "pending",
        candidate_score: profile.candidate_score,
        risk_score: profile.risk_score,
        skill_authenticity_score: profile.skill_authenticity_score,
        growth_potential_score: null,
        linkedin_url: null,
        github_url: null,
        graduation_year: null,
        prn_number: null,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          university: profileData.university,
          course: profileData.course,
          country: profileData.country,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="dark:border-slate-600">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="outline" className="dark:border-slate-600">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-[#2563EB]">
                {(profileData.full_name?.[0] || "U").toUpperCase()}
              </span>
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900 dark:text-white">{profileData.full_name || "User"}</CardTitle>
              <CardDescription className="dark:text-slate-400 flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-mono border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                  {profileData.skillmirror_id}
                </Badge>
                {profileData.verification_status === "verified" && (
                  <Badge className="bg-[#059669] text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-600 dark:text-slate-400">Full Name</Label>
                  {isEditing ? (
                    <Input 
                      value={profileData.full_name} 
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      className="mt-1 dark:bg-slate-700 dark:border-slate-600"
                    />
                  ) : (
                    <p className="mt-1 text-slate-900 dark:text-white">{profileData.full_name || "-"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  <p className="mt-1 text-slate-900 dark:text-white">{profileData.email}</p>
                </div>

                <div>
                  <Label className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Country
                  </Label>
                  {isEditing ? (
                    <Input 
                      value={profileData.country} 
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      className="mt-1 dark:bg-slate-700 dark:border-slate-600"
                    />
                  ) : (
                    <p className="mt-1 text-slate-900 dark:text-white">{profileData.country || "-"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Academic Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-600 dark:text-slate-400">University / College</Label>
                  {isEditing ? (
                    <Input 
                      value={profileData.university} 
                      onChange={(e) => handleInputChange("university", e.target.value)}
                      className="mt-1 dark:bg-slate-700 dark:border-slate-600"
                    />
                  ) : (
                    <p className="mt-1 text-slate-900 dark:text-white">{profileData.university || "-"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-slate-600 dark:text-slate-400">Course / Department</Label>
                  {isEditing ? (
                    <Input 
                      value={profileData.course} 
                      onChange={(e) => handleInputChange("course", e.target.value)}
                      className="mt-1 dark:bg-slate-700 dark:border-slate-600"
                    />
                  ) : (
                    <p className="mt-1 text-slate-900 dark:text-white">{profileData.course || "-"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-slate-600 dark:text-slate-400">SkillMirror ID</Label>
                  <p className="mt-1 font-mono text-slate-900 dark:text-white">{profileData.skillmirror_id || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores Section */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center">
                <Award className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Candidate Score</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {profileData.candidate_score ? `${profileData.candidate_score}%` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#059669]/10 dark:bg-[#059669]/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-[#059669]" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Risk Score</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {profileData.risk_score !== null ? `${profileData.risk_score}%` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Authenticity</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {profileData.skill_authenticity_score ? `${profileData.skill_authenticity_score}%` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EAB308]/10 dark:bg-[#EAB308]/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#EAB308]" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Growth Potential</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {profileData.growth_potential_score ? `${profileData.growth_potential_score}%` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 dark:text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="justify-start dark:border-slate-600 dark:hover:bg-slate-700">
              <a href="/dashboard/verifier">
                <FileText className="h-4 w-4 mr-2" />
                Verify Resume
              </a>
            </Button>
            <Button asChild variant="outline" className="justify-start dark:border-slate-600 dark:hover:bg-slate-700">
              <a href="/dashboard/skill-test">
                <Trophy className="h-4 w-4 mr-2" />
                Take Skill Test
              </a>
            </Button>
            <Button asChild variant="outline" className="justify-start dark:border-slate-600 dark:hover:bg-slate-700">
              <a href="/dashboard/certificate">
                <Award className="h-4 w-4 mr-2" />
                View Certificates
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardProfile;
