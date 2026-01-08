'use client';

import { Locale } from '@/i18n/config';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface IEnglishOnlyBannerProps {
  currentLocale: Locale;
  englishPath: string;
}

const COOKIE_NAME = 'english-only-banner-dismissed';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Banner component shown when page is not available in user's locale
 * Displays message with option to switch to English version
 * Dismissible with localStorage to remember dismissal
 */
export function EnglishOnlyBanner({
  currentLocale,
  englishPath,
}: IEnglishOnlyBannerProps): JSX.Element | null {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check if banner was previously dismissed
    const checkDismissal = () => {
      if (typeof window === 'undefined') return;

      try {
        const dismissed = localStorage.getItem(COOKIE_NAME);
        if (dismissed) {
          const dismissedTime = parseInt(dismissed, 10);
          const now = Date.now();
          // Check if dismissal is still valid (within 30 days)
          if (now - dismissedTime < COOKIE_MAX_AGE * 1000) {
            setIsDismissed(true);
          } else {
            // Expired, remove it
            localStorage.removeItem(COOKIE_NAME);
          }
        }
      } catch (error) {
        console.error('Error checking banner dismissal:', error);
      }

      // Show banner after a short delay for animation
      setTimeout(() => setIsVisible(true), 100);
    };

    checkDismissal();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 300); // Wait for animation

    // Store dismissal in localStorage
    try {
      localStorage.setItem(COOKIE_NAME, Date.now().toString());
    } catch (error) {
      console.error('Error storing banner dismissal:', error);
    }
  };

  const handleSwitchToEnglish = () => {
    // Navigate to English version
    router.push(englishPath);

    // Update locale cookie
    if (typeof document !== 'undefined') {
      document.cookie = `locale=en; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    }
  };

  // Don't render if dismissed or if already on English
  if (isDismissed || currentLocale === 'en' || !isVisible) {
    return null;
  }

  // Don't show if there's no valid English path
  if (!englishPath || englishPath === pathname) {
    return null;
  }

  return (
    <div
      className={`bg-info/10 border border-info/20 rounded-lg p-4 mb-6 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      data-english-only-banner
    >
      <div className="flex items-start gap-3">
        {/* Info Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-info"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-1 text-info">
            English Version Only
          </h3>
          <p className="text-sm text-info/80">
            This page is currently only available in English. Would you like to view the
            English version?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleSwitchToEnglish}
              className="text-sm font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-info/20 text-info/90 hover:bg-info/30 transition-colors border border-info/30"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
              Switch to English
            </button>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-info/60 hover:text-info transition-colors"
          aria-label="Dismiss"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
