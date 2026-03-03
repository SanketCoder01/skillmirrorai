import { Moon, Sun, Sparkles, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
        <Link to="/dashboard/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Avatar className="h-8 w-8 border-2 border-primary/30">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
              {(profile?.full_name?.[0] || profile?.display_name?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline">
            {profile?.full_name?.split(" ")[0] || profile?.display_name || "User"}
          </span>
        </Link>
      </div>
    </header>
  );
}
