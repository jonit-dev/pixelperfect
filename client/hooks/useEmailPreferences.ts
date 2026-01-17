'use client';

import { useState, useEffect, useCallback } from 'react';

export interface IEmailPreferences {
  marketing_emails: boolean;
  product_updates: boolean;
  low_credit_alerts: boolean;
}

export function useEmailPreferences(): {
  preferences: IEmailPreferences | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  updatePreference: (key: keyof IEmailPreferences, value: boolean) => Promise<void>;
  toggle: (key: keyof IEmailPreferences) => void;
} {
  const [preferences, setPreferences] = useState<IEmailPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/email/preferences');
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || 'Failed to fetch preferences');
        }

        setPreferences(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Update a single preference
  const updatePreference = useCallback(
    async (key: keyof IEmailPreferences, value: boolean): Promise<void> => {
      try {
        setIsUpdating(true);
        setError(null);

        const response = await fetch('/api/email/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: value }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || 'Failed to update preferences');
        }

        setPreferences(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update preferences');
        // Revert the change on error
        setPreferences(prev => (prev ? { ...prev, [key]: !value } : null));
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  // Toggle helper
  const toggle = useCallback(
    (key: keyof IEmailPreferences): void => {
      if (!preferences) return;
      updatePreference(key, !preferences[key]);
    },
    [preferences, updatePreference]
  );

  return {
    preferences,
    isLoading,
    isUpdating,
    error,
    updatePreference,
    toggle,
  };
}
