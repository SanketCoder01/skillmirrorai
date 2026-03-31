import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import SplineBackground from "@/components/SplineBackground";

const Register = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error, needsVerification } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error, variant: "destructive" });
    } else if (needsVerification) {
      toast({ 
        title: "Confirmation Email Sent", 
        description: "Please check your email and click the confirmation link to verify your account before signing in." 
      });
      navigate("/login?verification=pending");
    } else {
      toast({ title: "Account created!", description: "Redirecting to dashboard..." });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SplineBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="glass-card p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="font-display text-xl font-bold gradient-text">SkillMirror AI</span>
            </Link>
            <h1 className="font-display text-2xl font-bold">Create Account</h1>
            <p className="text-muted-foreground text-sm mt-1">Start your AI career analysis</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="John Doe" className="mt-1 bg-background/50" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1 bg-background/50" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" className="bg-background/50 pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter password"
                className="mt-1 bg-background/50"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full btn-glow bg-primary text-primary-foreground">
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <p className="text-center text-muted-foreground text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
