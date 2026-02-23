import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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
  updateActivity: () => Promise<void>;
  isSessionValid: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

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
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const navigate = useNavigate();

  const updateActivity = useCallback(async () => {
    setLastActivity(Date.now());
    if (user) {
      const { data } = await supabase.rpc("update_user_activity", { 
        p_user_id: user.id, 
        p_session_id: session?.access_token || "" 
      });
    }
  }, [user, session]);

  const checkInactivity = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase.rpc("check_user_inactivity", { 
      p_user_id: user.id, 
      p_minutes: 5 
    });
    
    if (data === true) {
      setIsSessionValid(false);

      await supabase.from("user_sessions")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("session_id", session?.access_token || "");

      await supabase.from("user_activity").insert({
        user_id: user.id,
        activity_type: "logout_inactive",
      });

      await supabase.auth.signOut();
      navigate("/login?reason=inactive");
    }
  }, [user, session, navigate]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    // Fallback timeout to ensure loading completes even if Supabase hangs
    const fallbackTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth loading timeout - forcing load complete");
        setLoading(false);
      }
    }, 5000); // 5 second fallback
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("display_name, email, last_seen_at, profile_completed, skillmirror_id, full_name, university, course, country, verification_status, candidate_score, risk_score, skill_authenticity_score")
            .eq("user_id", session.user.id)
            .maybeSingle();
          
          if (mounted && profileData) {
            setProfile(profileData as any);
          }
        } catch (error) {
          console.error("Profile fetch error:", error);
        }

        // Create session record (non-blocking)
        supabase.from("user_sessions").insert({
          user_id: session.user.id,
          session_id: session.access_token,
          expires_at: new Date(Date.now() + INACTIVITY_TIMEOUT).toISOString(),
        }).then(({ error }) => {
          if (error) console.error("Session insert error:", error);
        });

        supabase.from("user_activity").insert({
          user_id: session.user.id,
          activity_type: "login",
        }).then(({ error }) => {
          if (error) console.error("Activity insert error:", error);
        });
      } else {
        if (mounted) {
          setProfile(null);
          setIsSessionValid(true);
        }
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(fallbackTimeout);
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from("profiles")
          .select("display_name, email, last_seen_at, profile_completed, skillmirror_id, full_name, university, course, country, verification_status, candidate_score, risk_score, skill_authenticity_score")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data: profileData, error }) => {
            if (error) {
              console.error("Profile fetch error:", error);
            } else if (mounted && profileData) {
              setProfile(profileData as any);
            }
          });
      }
      setLoading(false);
    }).catch((error) => {
      clearTimeout(fallbackTimeout);
      console.error("Get session error:", error);
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Track activity and check for inactivity
  useEffect(() => {
    if (!user) return;

    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => updateActivity();

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        checkInactivity();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [user, lastActivity, updateActivity, checkInactivity]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: displayName },
      },
    });
    
    if (error) {
      return { error: error.message, needsVerification: false };
    }
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
      return { error: null, needsVerification: true };
    }
    
    return { error: null, needsVerification: false };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    if (user) {
      // Update session to inactive
      await supabase.from("user_sessions")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("session_id", session?.access_token || "");
      
      // Log logout activity
      await supabase.from("user_activity").insert({
        user_id: user.id,
        activity_type: "logout",
      });
    }
    await supabase.auth.signOut();
    setIsSessionValid(true);
    // Force page refresh to clear all state
    window.location.href = "/";
  };

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, email, last_seen_at, profile_completed, skillmirror_id, full_name, university, course, country, verification_status, candidate_score, risk_score, skill_authenticity_score, linkedin_url, github, graduation_year, prn, bio, research_interest, avatar_url, resume_url")
      .eq("user_id", user.id)
      .single();
    if (data) setProfile(data as any);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, profile, refreshProfile, updateActivity, isSessionValid }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
