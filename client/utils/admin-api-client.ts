import { createClient } from '@shared/utils/supabase/client';

/**
 * Get the current user's access token for authenticated API requests
 */
async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Make an authenticated API request to an admin endpoint
 * Automatically includes the Authorization header with JWT token
 */
export async function adminFetch<T = unknown>(
  url: string,
  options: Partial<{
    method: string;
    headers: Record<string, string>;
    body: string;
  }> = {}
): Promise<T> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('Authentication required. Please log in again.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'An error occurred',
    }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
