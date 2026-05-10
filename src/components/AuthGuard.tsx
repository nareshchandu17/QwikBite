'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// List of public routes that Don&apos;t require authentication
const publicRoutes = [
  '/',
  '/signin',
  '/signup',
  '/menu',
  '/_next',
  '/api/auth',
  '/api/register',
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const loading = status === 'loading';

  useEffect(() => {
    // Only run on client side after initial load
    if (typeof window === 'undefined' || loading) return;

    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || 
      pathname.startsWith(`${route}/`) ||
      pathname.startsWith('/_next/static/') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.js')
    );

    if (session?.user) {
      // If user is authenticated but on a public route, redirect to appropriate dashboard
      if (isPublicRoute && (pathname === '/' || pathname === '/signin' || pathname === '/signup')) {
        const redirectPath = session.user.role === 'admin' ? '/admin/dashboard' : '/customer';
        router.replace(redirectPath);
      }
    } else if (!isPublicRoute) {
      // If not authenticated and not on a public route, redirect to signin
      router.replace('/signin');
    }
  }, [session, loading, router, pathname]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // If It&apos;s a public route or user is authenticated, render children
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (isPublicRoute || session?.user) {
    return <>{children}</>;
  }

  // If not authenticated and not a public route, show nothing (will redirect)
  return null;
}
