import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../styles/globals.css';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  title: 'SOFE Admin — School of Founder Education',
  description: 'Operations, Curriculum, Community and Analytics Dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
