'use client';

import { ReactNode } from 'react';
import { SmartHeaderWrapper } from './SmartHeaderWrapper';
import { MobileBottomNav } from './MobileBottomNav';
import FullNavigationHeader from './FullNavigationHeader';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * App Layout Component
 * Wraps your app with smart header behavior and mobile bottom navigation
 * 
 * Usage in layout.tsx:
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         <AuthProvider>
 *           <UIProvider>
 *             <AppLayout>
 *               {children}
 *             </AppLayout>
 *           </UIProvider>
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 */
export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/' || pathname === '/customer' || pathname.startsWith('/customer/');
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Smart Header with scroll behavior */}
      <SmartHeaderWrapper threshold={50} hideOnScrollDown={true}>
        <FullNavigationHeader />
      </SmartHeaderWrapper>

      {/* Main Content with conditional padding */}
      <main className={`flex-1 ${isHomePage ? '' : 'pt-16'}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation (auto-hidden on desktop) */}
      <MobileBottomNav />
    </div>
  );
}
