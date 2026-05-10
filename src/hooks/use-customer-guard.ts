'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function useCustomerGuard() {
  // Use the centralized Auth context which is initialized from the server
  // (it calls /api/auth/me with credentials: 'include'). This avoids
  // relying on localStorage-only checks which can disagree with server
  // session state and cause unexpected redirects.
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    if (!loading && !isAuthenticated) {
      // Store the current path to redirect back after login
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : undefined;
      if (currentPath && currentPath !== '/signin') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      // Use the canonical sign-in route used across the app/middleware
      router.push('/signin');
    }
  }, [isAuthenticated, loading, router]);

  return { isAuthenticated, loading };
}
