import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, Loader2 } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Hardcoded admin credentials (in production, use proper auth)
    const ADMIN_EMAIL = "sanketg367@gmail.com";
    const ADMIN_PASSWORD = "Sanket@99";

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Store admin session
      localStorage.setItem("admin_session", JSON.stringify({
        email: ADMIN_EMAIL,
        role: "admin",
        logged_in_at: new Date().toISOString()
      }));
      toast({ title: "Welcome Admin!", description: "Login successful" });
      navigate("/admin");
    } else {
      toast({ title: "Access Denied", description: "Invalid admin credentials", variant: "destructive" });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display font-bold">Admin Login</CardTitle>
          <CardDescription>Restricted access - Admin only</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Admin Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-background/50"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-background/50"
                placeholder="Enter admin password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Login as Admin"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
