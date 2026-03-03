import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to automatically logout user after a period of inactivity
 * @param timeoutMinutes - Minutes of inactivity before logout (default: 5)
 * @param enabled - Whether the hook is active (default: true)
 */
export function useInactivityLogout(timeoutMinutes: number = 5, enabled: boolean = true) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());
  const pausedAtRef = useRef<Date | null>(null);

  const logout = async () => {
    console.log('Session expired due to inactivity, logging out...');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const resetTimer = () => {
    lastActivityRef.current = new Date();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (enabled) {
      timeoutRef.current = setTimeout(() => {
        const now = new Date();
        // If tab/app is not visible, do not count hidden time as inactivity.
        if (document.visibilityState !== 'visible') {
          return;
        }
        const diffMs = now.getTime() - lastActivityRef.current.getTime();
        const diffMins = diffMs / (1000 * 60);
        
        if (diffMins >= timeoutMinutes) {
          logout();
        }
      }, timeoutMinutes * 60 * 1000);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Events that reset the timer
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Initialize timer
    resetTimer();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pausedAtRef.current = new Date();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }

      // Visible again: treat this as activity and restart timer.
      pausedAtRef.current = null;
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });

      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timeoutMinutes, enabled]);

  return {
    lastActivity: lastActivityRef.current,
    resetTimer
  };
}
