import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { PusherProvider } from "@/context/PusherContext";
import { SessionProvider } from "@/providers/SessionProvider";
import { Toaster } from "@/components/ui/toaster";
import { AuthRedirector, AuthModal } from "@/components/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import GlobalStyles from "@/components/GlobalStyles";
import { NextAuthErrorBoundary } from "@/components/NextAuthErrorBoundary";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://qwikbite.vercel.app"),
  title: {
    default: "qwikBite - Smart Campus Dining",
    template: "%s | qwikBite",
  },
  description:
    "Order from your canteen in seconds. Skip the queues. Enjoy your break.",
  openGraph: {
    title: "qwikBite - Smart Campus Dining",
    description: "Order from your canteen in seconds. Skip the queues. Enjoy your break.",
    url: "https://qwikbite.vercel.app",
    siteName: "qwikBite",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/icon.png",
        width: 800,
        height: 600,
        alt: "qwikBite Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "qwikBite - Smart Campus Dining",
    description: "Order from your canteen in seconds. Skip the queues. Enjoy your break.",
    images: ["/icon.png"],
  },
  verification: {
    // Replace these placeholders with your actual verification strings
    google: "0d9f3079be06abfb",
    yandex: "yandex",
    yahoo: "yahoo",
    other: {
      "msvalidate.01": ["YOUR_BING_WEBMASTER_VERIFICATION_CODE"],
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050505",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} ${beVietnamPro.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={`${inter.className} bg-dark-bg text-white`}>
        <ErrorBoundary>
          <NextAuthErrorBoundary>
            <SessionProvider>
              <AuthProvider>
                <AuthModalProvider>
                  <PusherProvider>
                    <AuthRedirector>
                      <GlobalStyles />
                      {children}
                      <AuthModal />
                      <Toaster />
                      <Analytics />
                      <SpeedInsights />
                    </AuthRedirector>
                  </PusherProvider>
                </AuthModalProvider>
              </AuthProvider>
            </SessionProvider>
          </NextAuthErrorBoundary>
        </ErrorBoundary>
      </body>
    </html>
  );
}
