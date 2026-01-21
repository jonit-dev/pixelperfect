'use client';

import { type ReactNode } from 'react';
import { AnalyticsProvider } from '@client/components/analytics/AnalyticsProvider';
import { AuthErrorHandler } from '@client/components/auth/AuthErrorHandler';
import { Toast } from '@client/components/common/Toast';
import { AuthenticationModal } from '@client/components/modal/auth/AuthenticationModal';
import { AuthRequiredModal } from '@client/components/modal/auth/AuthRequiredModal';
import { BaselimeProvider } from '@client/components/monitoring/BaselimeProvider';

export function ClientProviders({ children }: { children: ReactNode }): ReactNode {
  return (
    <AnalyticsProvider>
      <BaselimeProvider>
        <AuthErrorHandler />
        <AuthenticationModal />
        <AuthRequiredModal />
        <Toast />
        {children}
      </BaselimeProvider>
    </AnalyticsProvider>
  );
}
