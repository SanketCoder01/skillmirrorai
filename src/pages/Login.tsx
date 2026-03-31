import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import SplineBackground from "@/components/SplineBackground";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const { signIn, resendVerificationEmail, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      const next = searchParams.get("next");
      navigate(next && next.startsWith("/") ? next : "/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate, searchParams]);

  useEffect(() => {
    const reason = searchParams.get("reason");
    const verification = searchParams.get("verification");
    const verified = searchParams.get("verified");
    
    if (reason === "inactive") {
      toast({
        title: "Session expired",
        description: "You were logged out due to inactivity. Please sign in again.",
        variant: "destructive",
      });
    }
    
    if (verification === "pending") {
      toast({
        title: "Email Verification Required",
        description: "Please check your email inbox (and spam folder) for the confirmation link. You must verify your email before signing in.",
      });
    }

    if (verified === "true") {
      toast({
        title: "Email Verified Successfully!",
        description: "Your email has been verified. You can now sign in to your account.",
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResendOption(false);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      // Check for specific error messages
      if (error.includes("Email not confirmed") || error.includes("email_not_confirmed")) {
        toast({ 
          title: "Email Not Verified", 
          description: "Please check your email and click the confirmation link before signing in. Check your spam folder if you don't see it.", 
          variant: "destructive" 
        });
        setShowResendOption(true);
        setUnverifiedEmail(email);
      } else {
        toast({ title: "Sign in failed", description: error, variant: "destructive" });
      }
    } else {
      const next = searchParams.get("next");
      navigate(next && next.startsWith("/") ? next : "/dashboard");
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    const { error, success } = await resendVerificationEmail(unverifiedEmail);
    setResendLoading(false);
    
    if (success) {
      toast({
        title: "Verification Email Sent!",
        description: "Please check your inbox (and spam folder) for the verification link.",
      });
      setShowResendOption(false);
    } else {
      toast({
        title: "Failed to Resend",
        description: error || "Could not resend verification email. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Don't render login form if already signed in
  if (user) {
    return null;
  }

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
            <h1 className="font-display text-2xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1 bg-background/50" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="bg-background/50 pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full btn-glow bg-primary text-primary-foreground">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          {/* Resend Verification Email Option */}
          {showResendOption && (
            <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-600">Email not verified yet?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click the link in your email, or resend the verification link.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="mt-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                  >
                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-center text-muted-foreground text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
