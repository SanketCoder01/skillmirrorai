import { LayoutDashboard, History, FileText, Settings, LogOut, ShieldCheck, PenTool, Shield, Trophy, Map, Award, MessageSquare, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/dashboard/profile", icon: User },
  { title: "Inbox", url: "/dashboard/inbox", icon: MessageSquare },
  { title: "Resume Analysis", url: "/dashboard/analysis", icon: FileText },
  { title: "Resume Verifier", url: "/dashboard/verifier", icon: Shield },
  { title: "Skill Test", url: "/dashboard/skill-test", icon: Trophy },
  { title: "Roadmap", url: "/dashboard/roadmap", icon: Map },
  { title: "Certificate", url: "/dashboard/certificate", icon: Award },
  { title: "ATS Score", url: "/dashboard/ats", icon: ShieldCheck },
  { title: "Resume Optimizer", url: "/dashboard/rewriter", icon: PenTool },
  { title: "History", url: "/dashboard/history", icon: History },
  { title: "Reports", url: "/dashboard/reports", icon: FileText },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Subscribe to new messages
      const channel = supabase
        .channel('student-messages-sidebar')
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
    }
  }, [user]);

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
    window.location.href = "/";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="bg-card/60 backdrop-blur-xl border-r border-border/30 pt-4">
        {/* User Profile Header */}
        {!collapsed && (
          <div className="px-3 pb-4 border-b border-border/30 mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {(profile?.full_name?.[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.full_name || "Student"}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email || user?.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground transition-colors" activeClassName="bg-primary/10 text-primary font-medium">
                      <div className="relative">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.title === "Inbox" && unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer">
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
