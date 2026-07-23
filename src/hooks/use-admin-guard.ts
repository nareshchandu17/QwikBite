'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function useAdminGuard() {
  const { isAuthenticated, loading, user } = useAuth();
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
      const targetUrl = currentPath && currentPath !== '/signin' ? currentPath : '/admin/dashboard';
      router.push(`/signin?callbackUrl=${encodeURIComponent(targetUrl)}`);
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    // Check if user is authenticated but not an admin
    if (!loading && isAuthenticated) {
      // If role is not set yet, wait a bit before checking
      // If role is not set yet, it means the session is still syncing
      if (!user?.role) {
        return;
      }
      
      // If role is set but not admin, redirect to customer dashboard
      if (user.role !== 'admin') {
        console.log('[useAdminGuard] User is not admin, redirecting to customer dashboard', { role: user.role });
        router.push('/customer');
      }
    }
  }, [isAuthenticated, loading, user, router]);

  return { isAuthenticated, loading, isAdmin: user?.role === 'admin' };
}
