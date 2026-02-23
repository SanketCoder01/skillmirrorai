import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Settings, User, Building2, Mail, Phone, Globe, MapPin, 
  LogOut, Save, Shield, CheckCircle
} from "lucide-react";

interface RecruiterData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  position: string | null;
  phone: string | null;
  country: string | null;
  company_website: string | null;
  is_verified: boolean;
  avatar_url: string | null;
}

const RecruiterSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<RecruiterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    company: "",
    position: "",
    phone: "",
    country: "",
    company_website: ""
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("recruiters")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        company: data.company || "",
        position: data.position || "",
        phone: data.phone || "",
        country: data.country || "",
        company_website: data.company_website || ""
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({ title: "Failed to load profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("recruiters")
        .update({
          full_name: formData.full_name || null,
          company: formData.company || null,
          position: formData.position || null,
          phone: formData.phone || null,
          country: formData.country || null,
          company_website: formData.company_website || null
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Settings updated successfully" });
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Failed to update settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        Settings
      </h2>

      {/* Verification Status */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Verification Status</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.is_verified 
                    ? "Your account is verified" 
                    : "Pending admin approval"}
                </p>
              </div>
            </div>
            {profile?.is_verified ? (
              <Badge className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" /> Verified
              </Badge>
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </Label>
              <Input
                value={profile?.email || ""}
                disabled
                className="mt-1 bg-muted"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Company
              </Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Position</Label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Country
              </Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="flex items-center gap-1">
                <Globe className="h-3 w-3" /> Company Website
              </Label>
              <Input
                value={formData.company_website}
                onChange={(e) => setFormData(prev => ({ ...prev, company_website: e.target.value }))}
                placeholder="https://company.com"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => fetchProfile()}>
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecruiterSettings;
