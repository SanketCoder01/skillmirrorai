import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Building2, Mail, Phone, Globe, MapPin, User, LogOut, 
  Save, Edit, ArrowLeft
} from "lucide-react";

interface RecruiterProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  company: string;
  position: string | null;
  phone: string | null;
  country: string | null;
  company_website: string | null;
  is_verified: boolean;
  approved_at: string | null;
}

const RecruiterProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit form state
  const [formData, setFormData] = useState({
    full_name: "",
    company: "",
    position: "",
    phone: "",
    country: "",
    company_website: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/recruiter/login");
        return;
      }

      const { data, error } = await supabase
        .from("recruiters")
        .select("*")
        .eq("email", user.email)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // If no profile exists, create one from auth metadata
        if (error.code === "PGRST116") {
          const newProfile = {
            user_id: user.id,
            full_name: user.user_metadata?.full_name || "",
            email: user.email || "",
            company: user.user_metadata?.company || "",
            position: null,
            phone: null,
            country: null,
            company_website: null,
            is_verified: true
          };
          
          const { data: created, error: createError } = await supabase
            .from("recruiters")
            .insert(newProfile)
            .select()
            .single();
            
          if (createError) {
            console.error("Error creating profile:", createError);
          } else {
            setProfile(created);
            setFormData({
              full_name: created.full_name,
              company: created.company,
              position: created.position || "",
              phone: created.phone || "",
              country: created.country || "",
              company_website: created.company_website || ""
            });
          }
        }
      } else {
        setProfile(data);
        setFormData({
          full_name: data.full_name,
          company: data.company,
          position: data.position || "",
          phone: data.phone || "",
          country: data.country || "",
          company_website: data.company_website || ""
        });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("recruiters")
        .update({
          full_name: formData.full_name,
          company: formData.company,
          position: formData.position || null,
          phone: formData.phone || null,
          country: formData.country || null,
          company_website: formData.company_website || null
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({ title: "✅ Profile Updated", description: "Your profile has been saved" });
      setEditing(false);
      fetchProfile();
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/recruiter/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Profile not found</p>
            <Button className="mt-4" onClick={() => navigate("/recruiter/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/recruiter/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Recruiter Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your profile information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white">
              {profile.is_verified ? "✓ Verified" : "Pending"}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEditing(!editing)}
              >
                <Edit className="h-4 w-4 mr-1" />
                {editing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Full Name *</label>
                    <Input 
                      value={formData.full_name} 
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <Input 
                      value={profile.email} 
                      disabled 
                      className="mt-1 bg-muted"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Company *</label>
                    <Input 
                      value={formData.company} 
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Position</label>
                    <Input 
                      value={formData.position} 
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Phone</label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Country</label>
                    <Input 
                      value={formData.country} 
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm text-muted-foreground">Company Website</label>
                    <Input 
                      value={formData.company_website} 
                      onChange={(e) => setFormData({...formData, company_website: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button className="w-full sm:w-auto" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="font-medium">{profile.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Company</p>
                      <p className="font-medium">{profile.company}</p>
                    </div>
                  </div>
                  {profile.position && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Position</p>
                        <p className="font-medium">{profile.position}</p>
                      </div>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{profile.phone}</p>
                      </div>
                    </div>
                  )}
                  {profile.country && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Country</p>
                        <p className="font-medium">{profile.country}</p>
                      </div>
                    </div>
                  )}
                  {profile.company_website && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 sm:col-span-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Website</p>
                        <a href={profile.company_website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                          {profile.company_website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                {profile.approved_at && (
                  <p className="text-xs text-muted-foreground">
                    Approved on: {new Date(profile.approved_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecruiterProfile;
