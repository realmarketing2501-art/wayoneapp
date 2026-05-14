import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { computeFingerprint } from '@/lib/fingerprint';

/**
 * Invokes the track-signup edge function with the device fingerprint.
 * Call once after a successful signUp / signIn / OAuth callback.
 */
export function trackAuthEvent(eventType: 'signup' | 'login') {
  computeFingerprint()
    .then((fp) =>
      supabase.functions.invoke('track-signup', {
        body: { event_type: eventType, ...fp },
      }),
    )
    .catch((e) => console.warn('[track-signup]', e));
}

/**
 * Auto-track current session: fires once when a user becomes available.
 */
export function useAutoTrackSession() {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user || fired.current) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        fired.current = true;
        trackAuthEvent('login');
      }
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);
}
