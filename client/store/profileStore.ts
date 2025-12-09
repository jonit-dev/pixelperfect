import { create } from 'zustand';
import type { IUserProfile, ISubscription } from '@shared/types/stripe';
import { StripeService } from '@client/services/stripeService';

interface IProfileState {
  profile: IUserProfile | null;
  subscription: ISubscription | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchProfile: () => Promise<void>;
  invalidate: () => void;
  reset: () => void;
}

// Cache duration: 30 seconds (avoids excessive refetches but stays reasonably fresh)
const CACHE_DURATION = 30 * 1000;

// Track in-flight requests to prevent duplicate calls
let fetchPromise: Promise<void> | null = null;

export const useProfileStore = create<IProfileState>((set, get) => ({
  profile: null,
  subscription: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchProfile: async () => {
    const state = get();

    // If we have fresh data, skip fetch
    if (state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION && state.profile) {
      return;
    }

    // If already fetching, wait for that request
    if (fetchPromise) {
      await fetchPromise;
      return;
    }

    set({ isLoading: true, error: null });

    fetchPromise = (async () => {
      try {
        const [profileData, subscriptionData] = await Promise.all([
          StripeService.getUserProfile(),
          StripeService.getActiveSubscription(),
        ]);

        set({
          profile: profileData,
          subscription: subscriptionData,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
        set({ error: errorMessage, isLoading: false });
      } finally {
        fetchPromise = null;
      }
    })();

    await fetchPromise;
  },

  invalidate: () => {
    set({ lastFetched: null });
  },

  reset: () => {
    set({
      profile: null,
      subscription: null,
      isLoading: false,
      error: null,
      lastFetched: null,
    });
  },
}));
