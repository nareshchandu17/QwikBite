'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext';

export default function TestAuthPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { openModal } = useAuthModal();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Open the sign up modal for testing
      openModal('signup');
    }
  }, [isAuthenticated, loading, openModal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-amber-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-amber-100">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">Authentication Test</h1>
        
        {isAuthenticated && user ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 mb-4">
              <span className="text-white font-bold text-xl">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome, {user.name}!</h2>
            <p className="text-gray-600 mb-4">You are logged in as a {user.role}.</p>
            <div className="bg-amber-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-sm text-amber-800">
                <span className="font-medium">Role:</span> {user.role}
              </p>
            </div>
            <button
              onClick={() => router.push(user.role === 'admin' ? '/admin/dashboard' : '/customer')}
              className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-md hover:shadow-lg transition-all duration-300"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-6">You are not currently logged in.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => openModal('signin')}
                className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-md hover:shadow-lg transition-all duration-300"
              >
                Sign In
              </button>
              <button
                onClick={() => openModal('signup')}
                className="flex-1 py-3 px-4 border border-amber-300 text-sm font-medium rounded-lg text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-md hover:shadow-lg transition-all duration-300"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}