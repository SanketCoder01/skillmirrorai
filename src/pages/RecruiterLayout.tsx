import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Outlet } from "react-router-dom";
import { 
  Building2, CheckCircle, MessageSquare,
  User, Settings, LogOut, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NotificationsDropdown from "@/components/NotificationsDropdown";

interface RecruiterData {
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
  avatar_url: string | null;
}

const sidebarItems = [
  { title: "Dashboard", url: "/recruiter/dashboard", icon: LayoutDashboard },
  { title: "Inbox", url: "/recruiter/inbox", icon: MessageSquare },
  { title: "Profile", url: "/recruiter/profile", icon: User },
  { title: "Settings", url: "/recruiter/settings", icon: Settings },
];

const RecruiterLayout = () => {
  const [recruiter, setRecruiter] = useState<RecruiterData | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchRecruiter();
      fetchUnreadCount();
    }
  }, [user]);

  // Realtime subscription for unread messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('recruiter-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchRecruiter = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("recruiters")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (!error && data) {
      setRecruiter(data);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;

    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .is("read_at", null);

    if (!error) {
      setUnreadCount(count || 0);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (url: string) => location.pathname === url;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card/50 backdrop-blur-lg flex flex-col fixed h-full z-50">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-display font-bold text-sm">{recruiter?.company || "Recruiter Portal"}</h1>
              <p className="text-xs text-muted-foreground">{recruiter?.full_name || "Recruiter"}</p>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <nav className="p-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.url}
                variant={isActive(item.url) ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 mb-1 ${isActive(item.url) ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => navigate(item.url)}
              >
                <div className="relative">
                  <item.icon className="h-4 w-4" />
                  {item.title === "Inbox" && unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                {item.title}
              </Button>
            ))}
          </nav>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={recruiter?.avatar_url || undefined} />
              <AvatarFallback>
                {(recruiter?.full_name?.[0] || "R").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{recruiter?.full_name || "Recruiter"}</p>
              <p className="text-xs text-muted-foreground truncate">{recruiter?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            {recruiter?.is_verified ? (
              <Badge className="bg-green-500 flex-1 justify-center">
                <CheckCircle className="h-3 w-3 mr-1" /> Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="flex-1 justify-center">Pending</Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet context={{ recruiter }} />
      </main>
    </div>
  );
};

export default RecruiterLayout;
