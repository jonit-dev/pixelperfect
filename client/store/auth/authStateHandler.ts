import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { createUserFromSession } from './authUtils';
import { handlePostAuthRedirect } from './postAuthRedirect';
import type { IAuthState } from './types';

const PROFILE_FETCH_TIMEOUT = 3000;

/**
 * Fetches the user role from the profiles table.
 */
async function fetchUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<'user' | 'admin'> {
  try {
    const profilePromise = supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const profileTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), PROFILE_FETCH_TIMEOUT);
    });

    const { data } = await Promise.race([profilePromise, profileTimeout]);
    return data?.role || 'user';
  } catch (error) {
    console.warn('Failed to fetch user profile role:', error);
    return 'user';
  }
}

/**
 * Handles sign out or token expiry events.
 */
function handleSignOut(
  setState: (state: Partial<IAuthState>) => void
): void {
  setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
}

/**
 * Handles user session events (sign in, token refresh with valid session).
 */
async function handleUserSession(
  supabase: SupabaseClient,
  session: Session,
  event: AuthChangeEvent,
  getState: () => IAuthState,
  setState: (state: Partial<IAuthState>) => void
): Promise<void> {
  const wasAuthenticated = getState().isAuthenticated;
  const role = await fetchUserRole(supabase, session.user.id);

  setState({
    user: createUserFromSession(session, role),
    isAuthenticated: true,
    isLoading: false,
  });

  // Handle post-auth actions for new sign-ins
  if (event === 'SIGNED_IN' && !wasAuthenticated && typeof window !== 'undefined') {
    await handlePostAuthRedirect();
  }
}

/**
 * Creates the auth state change handler for Supabase.
 */
export function createAuthStateHandler(
  supabase: SupabaseClient,
  getState: () => IAuthState,
  setState: (state: Partial<IAuthState>) => void
): (event: AuthChangeEvent, session: Session | null) => Promise<void> {
  return async (event: AuthChangeEvent, session: Session | null) => {
    // Handle sign out or token expired
    if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
      handleSignOut(setState);
      return;
    }

    // Handle valid user session
    if (session?.user) {
      await handleUserSession(supabase, session, event, getState, setState);
    } else {
      handleSignOut(setState);
    }
  };
}
