import { ClientProviders } from '../src/components/ClientProviders';
import { Layout } from '../src/components/layout/Layout';
import { TabNavigationClient } from '../src/components/navigation/TabNavigationClient';
import { getCategories } from '../src/lib/data';
import '../src/index.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PixelPerfect - Portfolio Management',
  description: 'Manage your investment portfolio with detailed asset tracking and analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = getCategories();

  return (
    <html lang="en">
      <body>
        <ClientProviders>
          <Layout>
            <TabNavigationClient categories={categories} />
            {children}
          </Layout>
        </ClientProviders>
      </body>
    </html>
  );
}
