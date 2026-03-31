import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, Eye, Clock, X, ChevronDown, ChevronUp, FileText, Target, Briefcase, MapPin, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface Analysis {
  id: string;
  created_at: string;
  target_role: string | null;
  match_score: number | null;
  location: string | null;
  career_level: string | null;
  market_demand_level: string | null;
  estimated_salary_range: string | null;
  profile_summary: string | null;
  core_skills: string[] | null;
  soft_skills: string[] | null;
  missing_skills: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  improvement_suggestions: string[] | null;
  certifications: string[] | null;
  suggested_projects: any[] | null;
  thirty_day_roadmap: any[] | null;
  key_actions: string[] | null;
  best_career_direction: string | null;
  skills_to_focus: string[] | null;
  risk_factors: string[] | null;
  resume_rewrite_suggestions: string[] | null;
  job_search_keywords: string[] | null;
}

const DashboardHistory = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setAnalyses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchHistory(); 
  }, [user]);

  // Real-time subscription for analyses changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('analyses-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'analyses',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newAnalysis = payload.new as Analysis;
          setAnalyses(prev => [newAnalysis, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setAnalyses(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Analysis removed." });
      setSelectedAnalysis(null);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderSection = (title: string, icon: any, content: any, sectionKey: string) => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;
    
    return (
      <div className="border border-border/30 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2 font-medium text-sm">
            {icon}
            {title}
          </span>
          {expandedSections[sectionKey] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <AnimatePresence>
          {expandedSections[sectionKey] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-2">
                {Array.isArray(content) ? (
                  content.map((item: any, i: number) => (
                    <div key={i} className="text-sm text-muted-foreground bg-muted/10 p-2 rounded">
                      {typeof item === 'string' ? item : item.title || JSON.stringify(item)}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{content}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" /> Analysis History
      </h2>
      
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : analyses.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">No analyses yet. Run your first career analysis!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedAnalysis(a)}>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{a.target_role || "General Analysis"}</p>
                    <Button size="sm" variant="ghost" className="h-6 px-2" onClick={(e) => { e.stopPropagation(); setSelectedAnalysis(a); }}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                    {a.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{a.location}
                      </span>
                    )}
                    {a.career_level && (
                      <Badge className="text-xs bg-primary/10 text-primary">{a.career_level}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {a.match_score != null && (
                    <div className="text-sm font-bold text-primary">{a.match_score}%</div>
                  )}
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detailed Analysis Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedAnalysis(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="font-display font-bold text-lg">{selectedAnalysis.target_role || "General Analysis"}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(selectedAnalysis.created_at).toLocaleString()}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedAnalysis(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)] space-y-4">
                {/* Score Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedAnalysis.match_score != null && (
                    <div className="bg-primary/10 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{selectedAnalysis.match_score}%</p>
                      <p className="text-xs text-muted-foreground">Match Score</p>
                    </div>
                  )}
                  {selectedAnalysis.career_level && (
                    <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-purple-400">{selectedAnalysis.career_level}</p>
                      <p className="text-xs text-muted-foreground">Career Level</p>
                    </div>
                  )}
                  {selectedAnalysis.market_demand_level && (
                    <div className="bg-green-500/10 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-green-400">{selectedAnalysis.market_demand_level}</p>
                      <p className="text-xs text-muted-foreground">Market Demand</p>
                    </div>
                  )}
                  {selectedAnalysis.estimated_salary_range && (
                    <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-amber-400">{selectedAnalysis.estimated_salary_range}</p>
                      <p className="text-xs text-muted-foreground">Salary Range</p>
                    </div>
                  )}
                </div>

                {/* Profile Summary */}
                {selectedAnalysis.profile_summary && (
                  <div className="bg-muted/10 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Profile Summary
                    </h4>
                    <p className="text-sm text-muted-foreground">{selectedAnalysis.profile_summary}</p>
                  </div>
                )}

                {/* Expandable Sections */}
                {renderSection("Core Skills", <Target className="h-4 w-4 text-primary" />, selectedAnalysis.core_skills, "core_skills")}
                {renderSection("Soft Skills", <Award className="h-4 w-4 text-purple-400" />, selectedAnalysis.soft_skills, "soft_skills")}
                {renderSection("Missing Skills", <TrendingUp className="h-4 w-4 text-red-400" />, selectedAnalysis.missing_skills, "missing_skills")}
                {renderSection("Strengths", <Award className="h-4 w-4 text-green-400" />, selectedAnalysis.strengths, "strengths")}
                {renderSection("Weaknesses", <TrendingUp className="h-4 w-4 text-amber-400" />, selectedAnalysis.weaknesses, "weaknesses")}
                {renderSection("Improvement Suggestions", <Target className="h-4 w-4 text-primary" />, selectedAnalysis.improvement_suggestions, "improvement_suggestions")}
                {renderSection("Recommended Certifications", <Award className="h-4 w-4 text-purple-400" />, selectedAnalysis.certifications, "certifications")}
                {renderSection("Suggested Projects", <Briefcase className="h-4 w-4 text-blue-400" />, selectedAnalysis.suggested_projects, "suggested_projects")}
                {renderSection("30-Day Roadmap", <Target className="h-4 w-4 text-primary" />, selectedAnalysis.thirty_day_roadmap, "roadmap")}
                {renderSection("Key Actions", <Target className="h-4 w-4 text-green-400" />, selectedAnalysis.key_actions, "key_actions")}
                {renderSection("Best Career Direction", <TrendingUp className="h-4 w-4 text-primary" />, selectedAnalysis.best_career_direction, "career_direction")}
                {renderSection("Skills to Focus", <Target className="h-4 w-4 text-amber-400" />, selectedAnalysis.skills_to_focus, "skills_to_focus")}
                {renderSection("Risk Factors", <TrendingUp className="h-4 w-4 text-red-400" />, selectedAnalysis.risk_factors, "risk_factors")}
                {renderSection("Resume Suggestions", <FileText className="h-4 w-4 text-primary" />, selectedAnalysis.resume_rewrite_suggestions, "resume_suggestions")}
                {renderSection("Job Search Keywords", <Target className="h-4 w-4 text-blue-400" />, selectedAnalysis.job_search_keywords, "job_keywords")}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardHistory;
