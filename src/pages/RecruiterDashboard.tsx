import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, Filter, MapPin, GraduationCap, Star, Eye, 
  Users, Shield, Download, X,
  ChevronDown, CheckCircle, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import NotificationsDropdown from "@/components/NotificationsDropdown";

interface Candidate {
  user_id: string;
  skillmirror_id: string;
  full_name: string;
  email: string;
  university: string;
  course: string;
  graduation_year: number;
  country: string;
  linkedin: string | null;
  github: string | null;
  candidate_score: number;
  risk_score: number;
  skill_authenticity_score: number;
  verification_status: string;
  created_at: string;
}

interface RecruiterProfile {
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
  approved_at: string | null;
  created_at: string;
  avatar_url: string | null;
}

const RecruiterDashboard = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [recruiter, setRecruiter] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    country: "",
    minScore: "",
    verificationStatus: "",
    graduationYear: "",
  });
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    verifiedCandidates: 0,
    avgScore: 0,
    viewsToday: 0,
  });
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRecruiterProfile();
      fetchCandidates();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [candidates, searchQuery, filters]);

  const fetchRecruiterProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("recruiters")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (error) {
      console.error("Error fetching recruiter profile:", error);
    } else {
      setRecruiter(data);
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          user_id,
          skillmirror_id,
          full_name,
          email,
          university,
          course,
          graduation_year,
          country,
          linkedin,
          github,
          candidate_score,
          risk_score,
          skill_authenticity_score,
          verification_status,
          created_at
        `)
        .eq("profile_completed", true)
        .order("candidate_score", { ascending: false });
      
      if (error) throw error;
      
      setCandidates(data || []);
      
      // Calculate stats
      const verified = (data || []).filter(c => c.verification_status === "verified").length;
      const avgScore = data && data.length > 0
        ? Math.round(data.reduce((sum, c) => sum + (c.candidate_score || 0), 0) / data.length)
        : 0;
      
      setStats({
        totalCandidates: data?.length || 0,
        verifiedCandidates: verified,
        avgScore,
        viewsToday: 0, // Would need to track this
      });
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load candidates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...candidates];
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.full_name?.toLowerCase().includes(query) ||
        c.skillmirror_id?.toLowerCase().includes(query) ||
        c.university?.toLowerCase().includes(query) ||
        c.course?.toLowerCase().includes(query)
      );
    }
    
    // Country filter
    if (filters.country) {
      filtered = filtered.filter(c => c.country === filters.country);
    }
    
    // Min score filter
    if (filters.minScore) {
      const minScore = parseInt(filters.minScore);
      filtered = filtered.filter(c => (c.candidate_score || 0) >= minScore);
    }
    
    // Verification status filter
    if (filters.verificationStatus) {
      filtered = filtered.filter(c => c.verification_status === filters.verificationStatus);
    }
    
    // Graduation year filter
    if (filters.graduationYear) {
      filtered = filtered.filter(c => c.graduation_year === parseInt(filters.graduationYear));
    }
    
    setFilteredCandidates(filtered);
  };

  const handleViewCandidate = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    
    // Log the view
    if (user && recruiter) {
      await supabase.from("candidate_views").insert({
        recruiter_id: recruiter.id,
        candidate_id: candidate.user_id,
        skillmirror_id: candidate.skillmirror_id,
      });
    }
  };

  const getUniqueCountries = () => {
    return [...new Set(candidates.map(c => c.country).filter(Boolean))];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
      case "test_completed":
        return <Badge className="bg-blue-500"><Shield className="h-3 w-3 mr-1" /> Tested</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const clearFilters = () => {
    setFilters({
      country: "",
      minScore: "",
      verificationStatus: "",
      graduationYear: "",
    });
    setSearchQuery("");
  };

  return (
    <>
      {/* Header */}
      <header className="border-b bg-card/40 backdrop-blur-lg sticky top-0 z-40 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Candidate Directory</h1>
            <p className="text-sm text-muted-foreground">Find and connect with verified candidates</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsDropdown />
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCandidates}</p>
                  <p className="text-xs text-muted-foreground">Total Candidates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.verifiedCandidates}</p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgScore}%</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.viewsToday}</p>
                  <p className="text-xs text-muted-foreground">Views Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, ID, university, skills..."
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <div>
                  <label className="text-sm text-muted-foreground">Country</label>
                  <Select value={filters.country} onValueChange={v => setFilters(prev => ({ ...prev, country: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All countries</SelectItem>
                      {getUniqueCountries().map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Min Score</label>
                  <Select value={filters.minScore} onValueChange={v => setFilters(prev => ({ ...prev, minScore: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Any score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any score</SelectItem>
                      <SelectItem value="90">90%+</SelectItem>
                      <SelectItem value="80">80%+</SelectItem>
                      <SelectItem value="70">70%+</SelectItem>
                      <SelectItem value="60">60%+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <Select value={filters.verificationStatus} onValueChange={v => setFilters(prev => ({ ...prev, verificationStatus: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="test_completed">Test Completed</SelectItem>
                      <SelectItem value="profile_completed">Profile Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Graduation Year</label>
                  <Select value={filters.graduationYear} onValueChange={v => setFilters(prev => ({ ...prev, graduationYear: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Any year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any year</SelectItem>
                      {[2026, 2025, 2024, 2023, 2022].map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 md:col-span-4">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" /> Clear Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredCandidates.length} of {candidates.length} candidates
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.user_id} className="glass-card hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleViewCandidate(candidate)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{candidate.full_name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{candidate.skillmirror_id}</p>
                    </div>
                    {getVerificationBadge(candidate.verification_status)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>{candidate.university}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{candidate.country}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className={`text-lg font-bold ${getScoreColor(candidate.candidate_score || 0)}`}>
                        {candidate.candidate_score || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{candidate.risk_score || 0}%</p>
                      <p className="text-xs text-muted-foreground">Risk</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{candidate.skill_authenticity_score || 0}%</p>
                      <p className="text-xs text-muted-foreground">Auth</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Progress value={candidate.candidate_score || 0} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredCandidates.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium">No candidates found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Candidate Detail Modal */}
        <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
          <DialogContent className="max-w-2xl">
            {selectedCandidate && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{selectedCandidate.full_name}</span>
                    {getVerificationBadge(selectedCandidate.verification_status)}
                  </DialogTitle>
                  <DialogDescription className="font-mono">
                    {selectedCandidate.skillmirror_id}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <p className={`text-2xl font-bold ${getScoreColor(selectedCandidate.candidate_score || 0)}`}>
                        {selectedCandidate.candidate_score}%
                      </p>
                      <p className="text-xs text-muted-foreground">Candidate Score</p>
                    </div>
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <p className="text-2xl font-bold">{selectedCandidate.risk_score}%</p>
                      <p className="text-xs text-muted-foreground">Risk Score</p>
                    </div>
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <p className="text-2xl font-bold">{selectedCandidate.skill_authenticity_score}%</p>
                      <p className="text-xs text-muted-foreground">Authenticity</p>
                    </div>
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <p className="text-2xl font-bold">{selectedCandidate.graduation_year}</p>
                      <p className="text-xs text-muted-foreground">Grad Year</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">University</p>
                      <p className="font-medium">{selectedCandidate.university}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Course</p>
                      <p className="font-medium">{selectedCandidate.course}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Country</p>
                      <p className="font-medium">{selectedCandidate.country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Profile Created</p>
                      <p className="font-medium">{new Date(selectedCandidate.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {selectedCandidate.linkedin && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedCandidate.linkedin} target="_blank" rel="noopener noreferrer">
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {selectedCandidate.github && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedCandidate.github} target="_blank" rel="noopener noreferrer">
                          GitHub
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default RecruiterDashboard;
