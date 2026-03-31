import { LayoutDashboard, History, FileText, LogOut, ShieldCheck, PenTool, Map, Award, User, Sparkles, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Sidebar items organized into sections
const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/dashboard/profile", icon: User },
];

const resumeItems = [
  { title: "Resume Analysis", url: "/dashboard/analysis", icon: FileText },
  { title: "ATS Score", url: "/dashboard/ats", icon: ShieldCheck },
  { title: "Resume Optimizer", url: "/dashboard/rewriter", icon: PenTool },
];

const growthItems = [
  { title: "Roadmap", url: "/dashboard/roadmap", icon: Map },
  { title: "Certificates", url: "/dashboard/certificate", icon: Award },
];

const historyItems = [
  { title: "History", url: "/dashboard/history", icon: History },
  { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
];

export function DashboardSidebar() {
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="bg-card/60 backdrop-blur-xl border-r border-border/30 pt-4">
        {/* User Profile Header */}
        {!collapsed && (
          <div className="px-3 pb-4 border-b border-border/30 mb-2">
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
        
        {/* Main Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs text-muted-foreground px-3 mb-1">Main</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground transition-colors" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Resume Tools Section */}
        <SidebarGroup className="mt-2">
          {!collapsed && <SidebarGroupLabel className="text-xs text-muted-foreground px-3 mb-1">Resume Tools</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {resumeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground transition-colors" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Growth Section */}
        <SidebarGroup className="mt-2">
          {!collapsed && <SidebarGroupLabel className="text-xs text-muted-foreground px-3 mb-1">Growth</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {growthItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground transition-colors" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* History Section */}
        <SidebarGroup className="mt-2">
          {!collapsed && <SidebarGroupLabel className="text-xs text-muted-foreground px-3 mb-1">History</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {historyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground transition-colors" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
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
