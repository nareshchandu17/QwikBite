import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, Be_Vietnam_Pro } from 'next/font/google';
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

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

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
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} ${beVietnamPro.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
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
      </body>
    </html>
  );
}