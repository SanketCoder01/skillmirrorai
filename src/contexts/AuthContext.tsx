import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error: string | null; success: boolean }>;
  profile: { 
    display_name: string; 
    email: string; 
    last_seen_at: string | null;
    profile_completed: boolean;
    skillmirror_id: string | null;
    full_name: string | null;
    university: string | null;
    course: string | null;
    country: string | null;
    verification_status: string | null;
    candidate_score: number | null;
    risk_score: number | null;
    skill_authenticity_score: number | null;
    linkedin_url: string | null;
    github: string | null;
    graduation_year: number | null;
    prn: string | null;
    bio: string | null;
    research_interest: string | null;
    avatar_url: string | null;
    resume_url: string | null;
  } | null;
  refreshProfile: () => Promise<void>;
  generateSkillMirrorId: (userId: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ 
    display_name: string; 
    email: string; 
    last_seen_at: string | null;
    profile_completed: boolean;
    skillmirror_id: string | null;
    full_name: string | null;
    university: string | null;
    course: string | null;
    country: string | null;
    verification_status: string | null;
    candidate_score: number | null;
    risk_score: number | null;
    skill_authenticity_score: number | null;
    linkedin_url: string | null;
    github: string | null;
    graduation_year: number | null;
    prn: string | null;
    bio: string | null;
    research_interest: string | null;
    avatar_url: string | null;
    resume_url: string | null;
  } | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, last_seen_at, profile_completed, skillmirror_id, full_name, university, course, country, verification_status, candidate_score, risk_score, skill_authenticity_score, linkedin_url, github, graduation_year, prn, bio, research_interest, avatar_url, resume_url")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("Profile fetch error:", error);
      } else if (data) {
        // If profile exists but no skillmirror_id, generate one
        if (!data.skillmirror_id && data.profile_completed) {
          console.log("Generating missing SkillMirror ID for user:", userId);
          const generatedId = await generateSkillMirrorId(userId);
          if (generatedId) {
            data.skillmirror_id = generatedId;
          }
        }
        setProfile(data as any);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Get initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log("Initial session:", session?.user?.email || "No session");
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes - but don't auto-logout on temporary session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Auth state changed:", event, session?.user?.email || "No session");
      
      // Only sign out on explicit SIGNED_OUT event, not on session changes
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      } else if (session) {
        // Other events with valid session - just update state, don't logout
        setSession(session);
        setUser(session.user);
        if (session.user) {
          fetchProfile(session.user.id);
        }
      }
      // If event is something else and session is null, DON'T clear state
      // This prevents logout on temporary network issues
    });

    // Periodic session refresh to keep session alive
    const refreshInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        // Session is still valid, refresh it
        await supabase.auth.refreshSession();
      }
    }, 4 * 60 * 1000); // Refresh every 4 minutes

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?verified=true`,
        data: { display_name: displayName },
      },
    });
    
    if (error) {
      return { error: error.message, needsVerification: false };
    }
    
    if (data.user && !data.session) {
      return { error: null, needsVerification: true };
    }
    
    return { error: null, needsVerification: false };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login?verified=true`,
      },
    });
    return { error: error?.message ?? null, success: !error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    window.location.href = "/";
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  const generateSkillMirrorId = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_skillmirror_id');
      if (error) throw error;
      
      // Update the profile with the generated ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ skillmirror_id: data })
        .eq('user_id', userId);
        
      if (updateError) throw updateError;
      
      // Refresh profile to get updated data
      await fetchProfile(userId);
      
      return data;
    } catch (error) {
      console.error('Failed to generate SkillMirror ID:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resendVerificationEmail, profile, refreshProfile, generateSkillMirrorId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
