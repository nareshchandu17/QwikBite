'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // If not authenticated, redirect to signin
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }

    // If authenticated, redirect to appropriate dashboard based on role
    if (user?.role) {
      const role = user.role.toLowerCase();
      if (role === 'admin' || role === 'canteen_staff') {
        router.push('/admin/dashboard');
      } else if (role === 'customer') {
        router.push('/customer');
      } else {
        // Default fallback
        router.push('/');
      }
    } else {
      // If no role, wait a bit and check again
      const timeout = setTimeout(() => {
        router.push('/signin');
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, user, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authorization Required</h1>
        <p className="text-gray-600 mb-6">
          You don&apos;t have permission to access this page. Redirecting you to the appropriate page...
        </p>
        
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-500">Checking your permissions...</span>
          </div>
          
          <button
            onClick={() => router.push('/signin')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Sign In
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
