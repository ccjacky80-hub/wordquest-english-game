import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ServiceWorkerRegistration } from '@/components/common/ServiceWorkerRegistration';
import './globals.css';

export const metadata: Metadata = {
  title: 'WordQuest / 单词小世界',
  description: 'A local-first English vocabulary adventure.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WordQuest',
  },
};

export const viewport: Viewport = {
  themeColor: '#18324b',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
