import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { SearchProvider } from "@/context/SearchContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { UIProvider } from "@/context/UIContext";
import { AppLayout } from "@/components/AppLayout";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { OrderProvider } from "@/context/OrderContext";
import QwikBiteAssistant from "@/components/customer/QwikBiteAssistant";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UIProvider>
      <SearchProvider>
        <AuthModalProvider>
          <FavoritesProvider>
            <OrderProvider>
              <AppLayout>
                {children}
              </AppLayout>
              <QwikBiteAssistant />
            </OrderProvider>
          </FavoritesProvider>
          <AuthModal />
        </AuthModalProvider>
      </SearchProvider>
    </UIProvider>
  );
}

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "qwikBite - Campus system",
  description: "Order your favorite food with Bolt",
  icons: {
    icon: [
      { url: '/images/favicon_enhanced.ico', sizes: 'any' },
    ],
  },
  other: {
    'material-symbols-outlined': 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'Bolt Food Delivery',
    title: 'Bolt - Food Delivery',
    description: 'Order your favorite food with Bolt',
  },
};
