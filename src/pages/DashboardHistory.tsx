import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Analysis {
  id: string;
  created_at: string;
  target_role: string | null;
  match_score: number | null;
  location: string | null;
}

const DashboardHistory = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("analyses")
      .select("id, created_at, target_role, match_score, location")
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
    }
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
              className="glass-card p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{a.target_role || "General Analysis"}</p>
                <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()} • {a.location || "No location"}</p>
              </div>
              {a.match_score != null && (
                <div className="text-sm font-bold text-primary">{a.match_score}%</div>
              )}
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardHistory;
