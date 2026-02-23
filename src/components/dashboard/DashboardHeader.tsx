import { Moon, Sun, Sparkles, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import NotificationsDropdown from "@/components/NotificationsDropdown";

export function DashboardHeader() {
  const { profile } = useAuth();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="h-14 border-b border-border/30 bg-card/40 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-display font-bold gradient-text text-sm hidden sm:inline">SkillMirror AI</span>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {/* Unique SkillMirror ID */}
        {profile?.skillmirror_id && (
          <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 font-mono text-xs border-primary/30 bg-primary/5 px-2.5 py-1">
            <Award className="h-3 w-3 text-primary" />
            <span className="text-primary font-semibold">{profile.skillmirror_id}</span>
          </Badge>
        )}
        <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="text-muted-foreground" title={dark ? "Switch to light mode" : "Switch to dark mode"}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <NotificationsDropdown />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            {(profile?.full_name?.[0] || profile?.display_name?.[0] || "U").toUpperCase()}
          </div>
          <span className="text-sm font-medium hidden sm:inline">{profile?.full_name?.split(" ")[0] || profile?.display_name || "User"}</span>
        </div>
      </div>
    </header>
  );
}
