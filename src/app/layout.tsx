import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { SessionProvider } from '@/providers/SessionProvider';
import { Toaster } from '@/components/ui/toaster';
import { AuthRedirector, AuthModal } from '@/components/auth';
import ErrorBoundary from '@/components/ErrorBoundary';
import GlobalStyles from '@/components/GlobalStyles';
import { NextAuthErrorBoundary } from '@/components/NextAuthErrorBoundary';
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
export const metadata: Metadata = {
  title: 'qwikBite - Smart Campus Dining',
  description: 'Order from your canteen in seconds. Skip the queues. Enjoy your break.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050505',
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-dark-bg text-white`}>
        <ErrorBoundary>
          <NextAuthErrorBoundary>
            <SessionProvider>
              <AuthProvider>
                <AuthModalProvider>
                  <WebSocketProvider>
                    <AuthRedirector>
                      <GlobalStyles />
                      {children}
                      <AuthModal />
                      <Toaster />
                      <SpeedInsights />
                    </AuthRedirector>
                  </WebSocketProvider>
                </AuthModalProvider>
              </AuthProvider>
            </SessionProvider>
          </NextAuthErrorBoundary>
        </ErrorBoundary>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      primary: '#FF512F',   /* Premium Orange */
                      secondary: '#F09819', /* Rich Amber */
                      tertiary: '#FFD700',  /* Gold */
                      success: '#4CAF50',
                      alert: '#FF3D00',
                      pending: '#FF9800',
                      neutral: '#9ca3af',
                      'dark-bg': '#050505'
                    },
                    transitionTimingFunction: {
                      'custom-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
                    },
                    boxShadow: {
                      'glow-primary': '0 0 25px rgba(255, 81, 47, 0.4)',
                      'glow-secondary': '0 0 25px rgba(240, 152, 25, 0.4)',
                    }
                  },
                },
              };
            `,
          }}
        />
      </body>
    </html>
  );
}