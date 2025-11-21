'use client';

import { type ReactNode } from 'react';
import { AuthErrorHandler } from './auth/AuthErrorHandler';
import { Toast } from './common/Toast';
import { AuthenticationModal } from './modal/auth/AuthenticationModal';
import { BaselimeProvider } from './monitoring/BaselimeProvider';

export function ClientProviders({ children }: { children: ReactNode }): ReactNode {
  return (
    <BaselimeProvider>
      <AuthErrorHandler />
      <AuthenticationModal />
      <Toast />
      {children}
    </BaselimeProvider>
  );
}
