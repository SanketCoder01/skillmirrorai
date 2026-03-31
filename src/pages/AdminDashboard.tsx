import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  Users, Building2, CheckCircle, XCircle, Clock, Mail, 
  Search, Award, Shield, TrendingUp, Eye, Send, LogOut, Phone, MapPin,
  FileText, Linkedin
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Student {
  user_id: string;
  full_name: string | null;
  email: string | null;
  skillmirror_id: string | null;
  university: string | null;
  course: string | null;
  country: string | null;
  verification_status: string | null;
  candidate_score: number | null;
  risk_score: number | null;
  skill_authenticity_score: number | null;
  avatar_url: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
}

interface StudentCertificate {
  id: string;
  certificate_name: string;
  issuing_company: string;
  issue_date: string;
  certificate_image_url: string | null;
}

interface RecruiterRequest {
  id: string;
  full_name: string;
  email: string;
  company: string;
  position: string | null;
  phone: string | null;
  country: string | null;
  company_website: string | null;
  status: string;
  user_id: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [recruiterRequests, setRecruiterRequests] = useState<RecruiterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchStudent, setSearchStudent] = useState("");
  const [searchRecruiter, setSearchRecruiter] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentCertificates, setStudentCertificates] = useState<StudentCertificate[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check admin session
    const adminSession = localStorage.getItem("admin_session");
    if (!adminSession) {
      navigate("/admin/login");
      return;
    }
    
    const session = JSON.parse(adminSession);
    setAdminEmail(session.email);
    
    fetchData();
    
    // Real-time subscription for recruiter_requests table
    const recruiterChannel = supabase
      .channel("admin-recruiter-requests-realtime")
      .on("postgres_changes", 
        { event: "INSERT", schema: "public", table: "recruiter_requests" }, 
        (payload) => {
          console.log("New recruiter request INSERT:", payload);
          toast({ 
            title: "🔔 New Recruiter Request!", 
            description: `${(payload.new as RecruiterRequest).full_name} from ${(payload.new as RecruiterRequest).company} is pending approval` 
          });
          setRecruiterRequests(prev => [payload.new as RecruiterRequest, ...prev]);
        }
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "recruiter_requests" },
        (payload) => {
          console.log("Recruiter request UPDATE:", payload);
          setRecruiterRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new as RecruiterRequest : r));
        }
      )
      .subscribe((status) => {
        console.log("Recruiter requests realtime status:", status);
      });

    // Real-time subscription for students/profiles table
    const studentChannel = supabase
      .channel("admin-students-realtime")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          console.log("New student INSERT:", payload);
          toast({
            title: "🎓 New Student Registered!",
            description: `${(payload.new as Student).full_name || 'A new student'} just registered`
          });
          setStudents(prev => [payload.new as Student, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log("Students realtime status:", status);
      });

    return () => {
      supabase.removeChannel(recruiterChannel);
      supabase.removeChannel(studentChannel);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    window.location.href = "/admin/login";
  };

  // Fetch certificates for selected student
  const fetchStudentCertificates = async (userId: string) => {
    setLoadingCertificates(true);
    try {
      const { data, error } = await supabase
        .from("user_certificates")
        .select("id, certificate_name, issuing_company, issue_date, certificate_image_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudentCertificates(data || []);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setStudentCertificates([]);
    } finally {
      setLoadingCertificates(false);
    }
  };

  // Handle student selection
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentCertificates([]);
    fetchStudentCertificates(student.user_id);
  };

  const fetchData = async () => {
    try {
      const [studentsRes, requestsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("recruiter_requests").select("*").order("created_at", { ascending: false }),
      ]);

      if (studentsRes.data) setStudents(studentsRes.data as Student[]);
      if (requestsRes.data) setRecruiterRequests(requestsRes.data as RecruiterRequest[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRecruiter = async (request: RecruiterRequest) => {
    // Prevent double clicks
    if (processingId === request.id) {
      console.log("Already processing this request, skipping...");
      return;
    }
    
    setProcessingId(request.id);
    console.log("=== START APPROVE ===");
    console.log("Request ID:", request.id, "Email:", request.email);
    
    // Step 1: Update status
    try {
      console.log("Step 1: Updating status to approved...");
      const updateResult = await supabase
        .from("recruiter_requests")
        .update({ 
          status: "approved",
          approved_at: new Date().toISOString()
        })
        .eq("id", request.id)
        .select();

      console.log("Update result:", JSON.stringify(updateResult, null, 2));

      if (updateResult.error) {
        console.error("Update error:", updateResult.error);
        toast({ 
          title: "Update Failed", 
          description: `${updateResult.error.message} (code: ${updateResult.error.code || 'unknown'})`,
          variant: "destructive"
        });
        setProcessingId(null);
        return;
      }
      
      if (!updateResult.data || updateResult.data.length === 0) {
        console.error("No rows updated - check RLS policies");
        toast({ 
          title: "Update Failed", 
          description: "No rows were updated. Check RLS policies.",
          variant: "destructive"
        });
        setProcessingId(null);
        return;
      }
      
      console.log("✓ Status updated successfully");
    } catch (err: any) {
      console.error("Update exception:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setProcessingId(null);
      return;
    }

    // Step 2: Add to recruiters table
    try {
      console.log("Step 2: Adding to recruiters table...");
      const { error: insertError } = await supabase
        .from("recruiters")
        .upsert({
          user_id: request.user_id || crypto.randomUUID(),
          full_name: request.full_name,
          email: request.email,
          company: request.company,
          position: request.position,
          phone: request.phone,
          country: request.country,
          company_website: request.company_website,
          is_verified: true,
          approved_at: new Date().toISOString()
        }, { 
          onConflict: 'email'
        });

      if (insertError) {
        console.error("Insert error:", insertError);
      } else {
        console.log("✓ Added to recruiters table");
      }
    } catch (err) {
      console.error("Insert exception:", err);
    }

    // Step 3: Send magic link via Supabase Auth
    try {
      console.log("Step 3: Sending magic link to:", request.email);
      
      const { data, error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: request.email,
        options: {
          emailRedirectTo: `${window.location.origin}/recruiter/profile`,
          shouldCreateUser: true,
          data: {
            role: "recruiter",
            full_name: request.full_name,
            company: request.company
          }
        }
      });

      console.log("Magic link response:", { success: !magicLinkError, error: magicLinkError?.message });

      if (magicLinkError) {
        console.error("Magic link error:", magicLinkError);
        toast({ 
          title: "✅ Approved (email failed)", 
          description: `${request.full_name} approved but email failed. They can login with their password.` 
        });
      } else {
        console.log("✓ Magic link sent successfully");
        toast({ 
          title: "✅ Approved!", 
          description: `${request.full_name} approved. Magic link sent to ${request.email}` 
        });
      }
    } catch (err: any) {
      console.error("Magic link exception:", err);
      toast({ 
        title: "✅ Approved (email failed)", 
        description: `${request.full_name} approved but email failed` 
      });
    }

    // Refresh data
    console.log("=== APPROVE COMPLETE ===");
    setProcessingId(null);
    fetchData();
  };

  const handleRejectRecruiter = async (request: RecruiterRequest) => {
    try {
      const { error } = await supabase
        .from("recruiter_requests")
        .update({ 
          status: "rejected",
          rejected_at: new Date().toISOString()
        })
        .eq("id", request.id);

      if (error) throw error;

      toast({ title: "Rejected", description: `${request.full_name}'s request has been rejected` });
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.skillmirror_id?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchStudent.toLowerCase())
  );

  const filteredRequests = recruiterRequests.filter(r =>
    r.full_name?.toLowerCase().includes(searchRecruiter.toLowerCase()) ||
    r.company?.toLowerCase().includes(searchRecruiter.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchRecruiter.toLowerCase())
  );

  const pendingRequests = filteredRequests.filter(r => r.status === "pending");
  const approvedRequests = filteredRequests.filter(r => r.status === "approved");
  const rejectedRequests = filteredRequests.filter(r => r.status === "rejected");

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage students and recruiter requests</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">{adminEmail}</span>
            <Badge className="bg-primary text-primary-foreground text-xs">Admin</Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Approved Recruiters</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{students.filter(s => s.verification_status === "verified").length}</p>
                  <p className="text-xs text-muted-foreground">Verified Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="recruiters" className="space-y-4">
          <TabsList className="bg-card/40 border border-border/50 flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="recruiters" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Recruiters
              {pendingRequests.length > 0 && (
                <Badge className="bg-yellow-500 text-white ml-1">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
              {approvedRequests.length > 0 && (
                <Badge className="bg-green-500 text-white ml-1">{approvedRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
              {rejectedRequests.length > 0 && (
                <Badge className="bg-red-500 text-white ml-1">{rejectedRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
          </TabsList>

          {/* Pending Recruiters Tab */}
          <TabsContent value="recruiters">
            <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg">Pending Requests ({pendingRequests.length})</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, company..."
                      value={searchRecruiter}
                      onChange={(e) => setSearchRecruiter(e.target.value)}
                      className="pl-9 bg-background/50"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No pending requests
                    </div>
                  ) : (
                    pendingRequests.map((request) => (
                    <div key={request.id} className="p-3 sm:p-4 rounded-lg border border-border/50 bg-muted/20">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{request.full_name}</h3>
                            <Badge className="bg-yellow-500 text-white text-xs">Pending</Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                            <Building2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{request.company} {request.position && `• ${request.position}`}</span>
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{request.email} {request.phone && `• ${request.phone}`}</span>
                          </p>
                          {request.company_website && (
                            <a href={request.company_website} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-primary hover:underline truncate block">
                              {request.company_website}
                            </a>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                          <Button size="sm" className="bg-green-500 hover:bg-green-600 flex-1 sm:flex-none" onClick={() => handleApproveRecruiter(request)}>
                            <CheckCircle className="h-4 w-4 sm:mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1 sm:flex-none" onClick={() => handleRejectRecruiter(request)}>
                            <XCircle className="h-4 w-4 sm:mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  )))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approved Recruiters Tab */}
          <TabsContent value="approved">
            <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Approved Recruiters ({approvedRequests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approvedRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No approved recruiters yet
                    </div>
                  ) : (
                    approvedRequests.map((request) => (
                    <div key={request.id} className="p-3 sm:p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base">{request.full_name}</h3>
                          <Badge className="bg-green-500 text-white text-xs">Approved</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                          <p className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {request.company} {request.position && `• ${request.position}`}
                          </p>
                          <p className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {request.email}
                          </p>
                          {request.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {request.phone}
                            </p>
                          )}
                          {request.country && (
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {request.country}
                            </p>
                          )}
                        </div>
                        {request.company_website && (
                          <a href={request.company_website} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-primary hover:underline">
                            {request.company_website}
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Approved: {request.approved_at ? new Date(request.approved_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rejected Recruiters Tab */}
          <TabsContent value="rejected">
            <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Rejected Requests ({rejectedRequests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rejectedRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No rejected requests
                    </div>
                  ) : (
                    rejectedRequests.map((request) => (
                    <div key={request.id} className="p-3 sm:p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base">{request.full_name}</h3>
                          <Badge className="bg-red-500 text-white text-xs">Rejected</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                          <p className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {request.company}
                          </p>
                          <p className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {request.email}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Rejected: {request.rejected_at ? new Date(request.rejected_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card className="border border-border/50 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg">All Students</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, ID, email..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      className="pl-9 bg-background/50"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Unique ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">University</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Score</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.user_id} className="border-b border-border/30 hover:bg-muted/20">
                          <td className="py-3 px-4 font-mono text-primary font-medium">
                            {student.skillmirror_id || "-"}
                          </td>
                          <td className="py-3 px-4">{student.full_name || "-"}</td>
                          <td className="py-3 px-4 text-muted-foreground">{student.email || "-"}</td>
                          <td className="py-3 px-4">{student.university || "-"}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-primary">
                              {student.candidate_score ? `${student.candidate_score}%` : "-"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={
                              student.verification_status === "verified" 
                                ? "bg-green-500 text-white" 
                                : "bg-yellow-500 text-white"
                            }>
                              {student.verification_status || "pending"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm" onClick={() => handleSelectStudent(student)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-3xl border border-border/50 bg-card my-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Details
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>✕</Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Header with Avatar */}
                <div className="flex items-center gap-4">
                  {selectedStudent.avatar_url ? (
                    <img 
                      src={selectedStudent.avatar_url} 
                      alt={selectedStudent.full_name || "Student"}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {(selectedStudent.full_name?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">{selectedStudent.full_name}</h3>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-mono text-primary text-sm">{selectedStudent.skillmirror_id}</span>
                    </div>
                  </div>
                </div>

                {/* Contact & Academic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-sm">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">University</p>
                    <p className="font-medium text-sm">{selectedStudent.university || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Course</p>
                    <p className="font-medium text-sm">{selectedStudent.course || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Country</p>
                    <p className="font-medium text-sm">{selectedStudent.country || "-"}</p>
                  </div>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Candidate Score</p>
                    <p className="text-2xl font-bold text-primary">{selectedStudent.candidate_score || 0}%</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                    <p className="text-2xl font-bold text-yellow-500">{selectedStudent.risk_score || 0}%</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Authenticity</p>
                    <p className="text-2xl font-bold text-green-500">{selectedStudent.skill_authenticity_score || 0}%</p>
                  </div>
                </div>

                {/* Student Uploads - Admin Only */}
                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Student Uploads (Admin Only)
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Resume */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Resume</span>
                      </div>
                      {selectedStudent.resume_url ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedStudent.resume_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3 mr-1" />
                            View Resume
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not uploaded</span>
                      )}
                    </div>

                    {/* LinkedIn */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">LinkedIn Profile</span>
                      </div>
                      {selectedStudent.linkedin_url ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedStudent.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3 mr-1" />
                            View Profile
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Certificates */}
                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certificates ({studentCertificates.length})
                  </h4>
                  
                  {loadingCertificates ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : studentCertificates.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No certificates uploaded</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {studentCertificates.map((cert) => (
                        <div key={cert.id} className="p-3 rounded-lg border border-border/50 bg-muted/20">
                          <div className="flex items-start gap-3">
                            {cert.certificate_image_url ? (
                              <img 
                                src={cert.certificate_image_url} 
                                alt={cert.certificate_name}
                                className="w-16 h-16 rounded object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{cert.certificate_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{cert.issuing_company}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(cert.issue_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {cert.certificate_image_url && (
                            <Button variant="ghost" size="sm" className="mt-2 w-full" asChild>
                              <a href={cert.certificate_image_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-3 w-3 mr-1" />
                                View Certificate
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
