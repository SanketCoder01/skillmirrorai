import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, Loader2, Mail, Lock, User, Phone, MapPin, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SplineBackground from "@/components/SplineBackground";

const RecruiterLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Registration fields
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        // Check for specific error messages
        if (error.includes("Email not confirmed") || error.includes("email_not_confirmed")) {
          toast({ 
            title: "Email Not Verified", 
            description: "Please check your email and click the confirmation link before signing in. Check your spam folder if you don't see it.", 
            variant: "destructive" 
          });
        } else {
          toast({ title: "Login failed", description: error, variant: "destructive" });
        }
        setLoading(false);
        return;
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "User not found", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check if user is an approved recruiter - check by EMAIL not user_id
      const { data: recruiter, error: recruiterError } = await supabase
        .from("recruiters")
        .select("id, is_verified, full_name, user_id, email")
        .eq("email", user.email)
        .maybeSingle();

      console.log("Recruiter check:", { recruiter, recruiterError, userEmail: user.email });

      if (!recruiter) {
        // If there's an APPROVED request but recruiters row is missing, create/link it now.
        const { data: approvedReq, error: approvedReqError } = await supabase
          .from("recruiter_requests")
          .select("full_name, email, company, position, phone, country, company_website, status")
          .eq("email", user.email)
          .maybeSingle();

        console.log("Recruiter request check:", { approvedReq, approvedReqError });

        if (approvedReq?.status === "approved") {
          const { error: upsertError } = await supabase
            .from("recruiters")
            .upsert(
              {
                user_id: user.id,
                full_name: approvedReq.full_name,
                email: approvedReq.email,
                company: approvedReq.company,
                position: approvedReq.position,
                phone: approvedReq.phone,
                country: approvedReq.country,
                company_website: approvedReq.company_website,
                is_verified: true,
              },
              { onConflict: "email" }
            );

          if (upsertError) {
            console.error("Failed to create recruiter profile:", upsertError);
            toast({
              title: "✅ Approved",
              description: "Your account is approved. Some profile data couldn't be saved yet, but you can continue.",
            });
            // Do NOT sign out: allow approved recruiter to proceed.
            navigate("/recruiter/dashboard");
            setLoading(false);
            return;
          }

          toast({
            title: "✅ Approved",
            description: "Your recruiter profile is ready. Logging you in...",
          });
          navigate("/recruiter/dashboard");
          setLoading(false);
          return;
        }

        if (approvedReq?.status === "pending") {
          toast({
            title: "⏳ Pending Approval",
            description: "Your request is being reviewed. You will receive an email once approved.",
            variant: "destructive",
          });
        } else if (approvedReq?.status === "rejected") {
          toast({
            title: "Request Rejected",
            description: "Your recruiter application was not approved.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Not a recruiter account",
            description: "Please register as a recruiter first.",
            variant: "destructive",
          });
        }
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!recruiter.is_verified) {
        toast({ 
          title: "⏳ Pending Approval", 
          description: "Your account is pending admin approval. You will receive an email once approved.", 
          variant: "destructive" 
        });
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      
      toast({ title: "Welcome!", description: `Logged in as ${recruiter.full_name || 'Recruiter'}` });
      navigate("/recruiter/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    
    // Required fields - company_website is optional
    if (!fullName || !companyName || !phone || !country || !email) {
      toast({ title: "Missing fields", description: "Please fill all required fields (name, company, phone, country, email)", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    
    // Check if email already exists in recruiter_requests
    try {
      const { data: existingRequest } = await supabase
        .from("recruiter_requests")
        .select("status")
        .eq("email", email)
        .maybeSingle();
      
      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast({ 
            title: "Already Registered", 
            description: "This email already has a pending request. Please wait for approval.", 
            variant: "destructive" 
          });
        } else if (existingRequest.status === 'approved') {
          toast({ 
            title: "Already Approved", 
            description: "This email is already approved. Please login.", 
            variant: "destructive" 
          });
        } else if (existingRequest.status === 'rejected') {
          toast({ 
            title: "Previously Rejected", 
            description: "Your previous application was rejected. Please contact admin.", 
            variant: "destructive" 
          });
        }
        setSubmitting(false);
        return;
      }
    } catch (err) {
      console.error("Error checking existing email:", err);
    }
    
    // Capture values before any state changes
    const submittedEmail = email;
    const submittedPassword = password;
    const submittedFullName = fullName;
    const submittedCompanyName = companyName;
    const submittedDesignation = designation;
    const submittedPhone = phone;
    const submittedCountry = country;
    const submittedCompanyWebsite = companyWebsite;
    
    try {
      // Simple, direct insert with retry for abort errors
      let insertResult;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`Insert attempt ${attempts}/${maxAttempts}`);
        
        insertResult = await supabase
          .from("recruiter_requests")
          .insert({
            full_name: submittedFullName,
            email: submittedEmail,
            company: submittedCompanyName,
            position: submittedDesignation || null,
            phone: submittedPhone,
            country: submittedCountry,
            company_website: submittedCompanyWebsite || null,
            status: "pending",
          })
          .select();

        const insertError = insertResult.error;
        
        // If success, break out of retry loop
        if (!insertError) {
          break;
        }
        
        // If it's an abort error and we have attempts left, retry
        const isAbort = insertError.message?.toLowerCase().includes('abort') || 
                        insertError.hint?.toLowerCase().includes('abort');
        
        if (isAbort && attempts < maxAttempts) {
          console.log("Request aborted, retrying...");
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
          continue;
        }
        
        // For other errors or max attempts reached, handle error
        if (insertError) {
          if (insertError.code === "23505") {
            toast({
              title: "Already Registered",
              description: "This email already has a pending request. Please wait for approval.",
              variant: "destructive",
            });
          } else {
            console.error("Insert error:", insertError);
            toast({
              title: "Request not saved",
              description: `${insertError.message || "Database error"} (code: ${insertError.code || "unknown"})`,
              variant: "destructive",
            });
          }
          setSubmitting(false);
          return;
        }
      }

      const { data, error: finalError } = insertResult!;
      
      if (finalError) {
        toast({
          title: "Request not saved",
          description: "Please try again later",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Success! Request is saved
      console.log("Request saved successfully:", data);
      toast({
        title: "✅ Request Submitted Successfully!",
        description: "Admin will review your request. You will receive an email once approved.",
      });

      // Clear form AFTER successful insert
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setCompanyName("");
      setCompanyWebsite("");
      setDesignation("");
      setPhone("");
      setCountry("");
      setIsLogin(true);
      setSubmitting(false);

      // Create auth user in background (non-blocking)
      supabase.auth.signUp({
        email: submittedEmail,
        password: submittedPassword,
        options: {
          data: {
            role: "recruiter",
            full_name: submittedFullName,
          },
        },
      }).then(({ data, error: signUpError }) => {
        if (!signUpError && data.user) {
          supabase
            .from("recruiter_requests")
            .update({ user_id: data.user.id })
            .eq("email", submittedEmail)
            .then(() => console.log("User ID linked to request"));
        }
      });

    } catch (err: any) {
      console.error("Register submit error:", err);
      toast({
        title: "Request not saved",
        description: err?.message || "Network error while saving request",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SplineBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="glass-card p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="font-display text-xl font-bold gradient-text">SkillMirror</span>
            </Link>
            <h1 className="font-display text-2xl font-bold">Recruiter Portal</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isLogin ? "Sign in to find verified candidates" : "Register your company"}
            </p>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="fullName" className="flex items-center gap-1">
                    <User className="h-3 w-3" /> Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="mt-1 bg-background/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="company" className="flex items-center gap-1">
                      <Building className="h-3 w-3" /> Company Name *
                    </Label>
                    <Input
                      id="company"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      required
                      placeholder="Acme Inc."
                      className="mt-1 bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={designation}
                      onChange={e => setDesignation(e.target.value)}
                      placeholder="HR Manager"
                      className="mt-1 bg-background/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      placeholder="+1 234 567 890"
                      className="mt-1 bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Country *
                    </Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      required
                      placeholder="United States"
                      className="mt-1 bg-background/50"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website">Company Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={companyWebsite}
                    onChange={e => setCompanyWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="mt-1 bg-background/50"
                  />
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="mt-1 bg-background/50"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> Password *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Min 8 characters"
                  className="bg-background/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  className="mt-1 bg-background/50"
                />
              </div>
            )}

            <Button type="submit" disabled={loading || submitting} className="w-full btn-glow bg-primary text-primary-foreground">
              {(loading || submitting) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isLogin ? "Signing in..." : "Submitting Request..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Submit Registration Request"
              )}
            </Button>

            {!isLogin && (
              <p className="text-xs text-center text-muted-foreground">
                Your registration will be reviewed by admin. You'll receive an email once approved.
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isLogin ? "Need a recruiter account? " : "Already have an account? "}
              <span className="text-primary hover:underline">
                {isLogin ? "Register here" : "Sign in"}
              </span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Looking for candidate login? <span className="text-primary hover:underline">Click here</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterLogin;
