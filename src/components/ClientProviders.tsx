'use client';

import { type ReactNode } from 'react';
import { AnalyticsProvider } from './analytics/AnalyticsProvider';
import { AuthErrorHandler } from './auth/AuthErrorHandler';
import { Toast } from './common/Toast';
import { AuthenticationModal } from './modal/auth/AuthenticationModal';
import { BaselimeProvider } from './monitoring/BaselimeProvider';

export function ClientProviders({ children }: { children: ReactNode }): ReactNode {
  return (
    <AnalyticsProvider>
      <BaselimeProvider>
        <AuthErrorHandler />
        <AuthenticationModal />
        <Toast />
        {children}
      </BaselimeProvider>
    </AnalyticsProvider>
  );
}
