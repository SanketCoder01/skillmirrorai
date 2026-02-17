import { useState } from "react";
import { Settings, User, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const DashboardSettings = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Profile updated successfully." });
    }
  };

  const handleClearHistory = async () => {
    if (!user || !confirm("Are you sure you want to delete all your analysis history?")) return;
    const { error } = await supabase.from("analyses").delete().eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: "Failed to clear history", variant: "destructive" });
    } else {
      toast({ title: "Cleared", description: "All analysis history deleted." });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" /> Settings
      </h2>

      {/* Profile */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-medium text-sm flex items-center gap-2"><User className="h-4 w-4" /> Profile</h3>
        <div>
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input value={profile?.email || user?.email || ""} disabled className="mt-1 bg-muted/30" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Display Name</Label>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 bg-background/50" />
        </div>
        <Button onClick={handleUpdateProfile} disabled={saving} className="btn-glow bg-primary text-primary-foreground">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Danger zone */}
      <div className="glass-card p-6 space-y-4 border border-destructive/20">
        <h3 className="font-medium text-sm text-destructive">Danger Zone</h3>
        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleClearHistory}>
          <Trash2 className="h-4 w-4 mr-2" /> Clear All History
        </Button>
        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
};

export default DashboardSettings;
