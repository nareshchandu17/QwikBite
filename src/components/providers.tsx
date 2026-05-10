'use client';

'use client';

import AppErrorBoundary from '@/components/AppErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { Toaster } from '@/components/ui/toaster';

// Providers wraps every client-only context and UI helper needed at the root
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AuthModalProvider>
          {children}
          <Toaster />
        </AuthModalProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}



