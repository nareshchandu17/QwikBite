'use client';

import { useAuth } from '@/context/AuthContext';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function AuthDebug() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: session, status } = useSession();
  const [cookies, setCookies] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCookies(document.cookie);
    }
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50 max-h-96 overflow-y-auto">
      <div className="font-bold mb-2 text-yellow-400">Auth Debug Info:</div>
      <div className="space-y-2">
        <div className="border-b border-gray-600 pb-1">
          <div className="font-semibold text-green-400">NextAuth Session:</div>
          <div>Status: {status}</div>
          <div>Session: {session ? '✅ Found' : '❌ None'}</div>
          {session && (
            <div className="ml-2 text-gray-300">
              <div>User ID: {session.user?.id}</div>
              <div>Email: {session.user?.email}</div>
              <div>Role: {session.user?.role}</div>
            </div>
          )}
        </div>
        
        <div className="border-b border-gray-600 pb-1">
          <div className="font-semibold text-blue-400">AuthContext:</div>
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>Is Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
          <div>User: {user ? '✅ Found' : '❌ None'}</div>
          {user && (
            <div className="ml-2 text-gray-300">
              <div>User ID: {user.id}</div>
              <div>Email: {user.email}</div>
              <div>Role: {user.role}</div>
            </div>
          )}
        </div>

        <div className="border-b border-gray-600 pb-1">
          <div className="font-semibold text-orange-400">Cookies:</div>
          <div className="text-gray-300 break-all">
            {cookies || 'No cookies found'}
          </div>
        </div>

        <div className="text-purple-400">
          <div className="font-semibold">Quick Test:</div>
          <button 
            onClick={() => window.location.href = '/api/auth-debug'}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white mr-2 mb-2"
          >
            Test Auth API
          </button>
          <button 
            onClick={() => window.location.href = '/api/test-session'}
            className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-white mr-2 mb-2"
          >
            Test Server Session
          </button>
          <br />
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-white mr-2"
          >
            Reload Page
          </button>
          <button 
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white"
          >
            Clear & Reload
          </button>
        </div>
      </div>
    </div>
  );
}
