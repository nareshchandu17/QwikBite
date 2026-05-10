'use client';

import { useAdminGuard } from '@/lib/auth/roleGuard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, isAdmin } = useAdminGuard();
  const { user } = useAuth();
  const router = useRouter();

  // If not authenticated or not admin, Don&apos;t render children
  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You Don&apos;t have permission to access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline text-sm text-gray-700">Welcome, {user?.name}</span>
            <button
              onClick={() => {
                // Handle logout
                router.push('/api/auth/logout');
              }}
              className="text-sm text-amber-600 hover:text-amber-800 whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Scrollable Content */}
      <main className="flex-1 pt-16 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-4 sm:px-6 lg:px-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
