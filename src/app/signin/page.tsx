'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthModal } from '@/context/AuthModalContext';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { openModal } = useAuthModal();
  const loading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const user = session?.user;

  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  useEffect(() => {
    // Wait until auth initialization finishes
    if (loading) return;

    // ✅ If already authenticated, redirect to callback or appropriate page
    if (isAuthenticated && user) {
      console.log('[SignIn] User already authenticated, redirecting to:', callbackUrl);
      
      // Redirect to callback URL or role-based home
      if (callbackUrl && callbackUrl !== '/signin' && callbackUrl !== '/') {
        router.replace(callbackUrl);
      } else {
        // Use role-based redirect
        if (user.role === 'admin' || user.role === 'canteen_staff') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/customer/home');
        }
      }
      return;
    }

    const url = new URL(callbackUrl, window.location.origin);

    // Prevent redirecting back to /signin (loop safety)
    const cleanCallback =
      url.pathname === '/signin'
        ? '/'
        : url.pathname + url.search;

    // Open sign-in modal
    openModal('signin', cleanCallback);

    // Fallback: if modal fails to open, redirect home and force modal
    const timer = setTimeout(() => {
      if (!document.querySelector('[role="dialog"]')) {
        router.replace('/?showAuthModal=signin');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [callbackUrl, openModal, router, loading, isAuthenticated, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-amber-700">Opening sign-in…</p>
      </div>
    </div>
  );
}
