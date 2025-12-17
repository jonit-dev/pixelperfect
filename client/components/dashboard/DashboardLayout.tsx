'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DashboardSidebar } from '@client/components/dashboard/DashboardSidebar';

interface IDashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<IDashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isStudio = pathname === '/dashboard';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className={`flex-1 overflow-auto ${isStudio ? 'bg-zinc-950' : ''}`}>
        <div className={isStudio ? 'p-0 h-full' : 'p-8'}>{children}</div>
      </main>
    </div>
  );
};
