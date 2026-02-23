import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Building2, Mail, User, Lock, Phone, Building, MapPin } from "lucide-react";

const RecruiterRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    company_name: "",
    company_website: "",
    phone: "",
    designation: "",
    country: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirm_password) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (formData.password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: "recruiter",
            full_name: formData.full_name,
          },
        },
      });

      if (authError) throw authError;

      if (user) {
        // Create recruiter profile
        const { error: profileError } = await supabase
          .from("recruiters")
          .insert({
            user_id: user.id,
            full_name: formData.full_name,
            email: formData.email,
            company_name: formData.company_name,
            company_website: formData.company_website,
            phone: formData.phone,
            designation: formData.designation,
            country: formData.country,
            status: "pending",
          });

        if (profileError) throw profileError;

        toast({
          title: "Registration Submitted",
          description: "Your request has been submitted for approval. You will receive an email once approved.",
        });

        navigate("/recruiter/login");
      }
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Registration failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display font-bold">Recruiter Registration</CardTitle>
          <CardDescription>Register to access verified candidate profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Personal Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Full Name *
                  </Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    className="mt-1 bg-background/50"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email *
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="mt-1 bg-background/50"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Password *
                  </Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="mt-1 bg-background/50"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Confirm Password *
                  </Label>
                  <Input
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) => handleInputChange("confirm_password", e.target.value)}
                    className="mt-1 bg-background/50"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h4 className="text-sm font-medium text-muted-foreground">Company Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building className="h-3 w-3" /> Company Name *
                  </Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                    className="mt-1 bg-background/50"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Company Website</Label>
                  <Input
                    type="url"
                    value={formData.company_website}
                    onChange={(e) => handleInputChange("company_website", e.target.value)}
                    className="mt-1 bg-background/50"
                    placeholder="https://"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone *
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="mt-1 bg-background/50"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Designation *</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => handleInputChange("designation", e.target.value)}
                    className="mt-1 bg-background/50"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Country *
                </Label>
                <Input
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  className="mt-1 bg-background/50"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? "Submitting..." : "Submit Registration Request"}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Your registration will be reviewed by admin. You'll receive an email once approved.
            </p>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/recruiter/login" className="text-primary hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecruiterRegister;
