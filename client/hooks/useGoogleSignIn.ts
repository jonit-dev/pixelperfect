import { useState, useCallback } from 'react';
import { createClient } from '@shared/utils/supabase/client';
import { useToastStore } from '@client/store/toastStore';
import { setAuthIntent } from '@client/utils/authRedirectManager';

export const useGoogleSignIn = (): {
  signIn: (returnTo?: string) => Promise<void>;
  loading: boolean;
} => {
  const { showToast } = useToastStore();
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(
    async (returnTo?: string): Promise<void> => {
      setLoading(true);

      try {
        // Store return URL for after auth
        if (returnTo) {
          setAuthIntent({ action: 'oauth_complete', returnTo });
        }

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`,
            scopes: 'email profile',
            queryParams: { access_type: 'offline', prompt: 'select_account' },
          },
        });

        if (error) {
          showToast({ message: error.message, type: 'error' });
          setLoading(false);
        }
        // Note: Don't setLoading(false) on success - page will redirect
      } catch (err) {
        console.error('Error during Google sign-in:', err);
        showToast({
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
          type: 'error',
        });
        setLoading(false);
      }
    },
    [showToast]
  );

  return { signIn, loading };
};
