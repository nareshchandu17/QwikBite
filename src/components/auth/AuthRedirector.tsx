'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function AuthRedirector({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Public paths that Don&apos;t require authentication
  const publicPaths = [
    '/', 
    '/signin', 
    '/signup', 
    '/menu', 
    '/api', 
    '/_next',
  ];

  useEffect(() => {
    // Don&apos;t do anything while loading or if pathname is null
    if (loading || !pathname) return;
    
    // Prevent multiple redirects
    if (hasRedirected) return;
    
    const isPublicPath = publicPaths.some(
      (path) => pathname === path || pathname.startsWith(path + '/') || pathname.startsWith('/_next')
    );
    
    // Only redirect non-public paths for non-authenticated users
    // Only redirect if we're sure the user is not authenticated (loading finished)
    if (!loading && !user && !isPublicPath && pathname !== '/') {
      setHasRedirected(true);
      const searchParams = new URLSearchParams();
      searchParams.set('callbackUrl', pathname || '/');
      router.push(`/signin?${searchParams.toString()}`);
    }
  }, [user, loading, pathname, router, hasRedirected, publicPaths]);

  // Use state to track if we're on the client
  const [isClient, setIsClient] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Set isClient to true after mount to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);

    // Safety timeout: if auth takes more than 5 seconds, allow rendering
    const timeout = setTimeout(() => {
      setIsTimedOut(true);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  // Calculate if the current path is a public path
  const isPublicPath = pathname ? publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/') || pathname.startsWith('/_next')
  ) : false;

  // We allow children to render immediately. 
  // Redirection is handled primarily by middleware.ts for better performance.
  // AuthRedirector now only serves as a client-side backup.
  return <>{children}</>;
}
