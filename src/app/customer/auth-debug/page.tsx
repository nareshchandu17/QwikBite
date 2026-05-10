'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export default function AuthDebugPage() {
  const { user, token, isAuthenticated } = useAuth();
  const [cookies, setCookies] = useState('');
  const [serverAuthResponse, setServerAuthResponse] = useState<unknown>(null);
  const [cookieCheckResponse, setCookieCheckResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get all cookies
    if (typeof window !== 'undefined') {
      setCookies(document.cookie);
    }
  }, []);

  const testServerAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth-debug');
      const data = await response.json();
      setServerAuthResponse(data);
    } catch (error: unknown) {
      setServerAuthResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkCookies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-cookies');
      const data = await response.json();
      setCookieCheckResponse(data);
    } catch (error: unknown) {
      setCookieCheckResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Client-side Auth State:</h2>
            <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
              {JSON.stringify({ user, token, isAuthenticated }, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Client-side Cookies:</h2>
            <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
              {cookies || 'No cookies found'}
            </pre>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Server-side Cookie Check:</h2>
            <button 
              onClick={checkCookies}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mt-2"
            >
              {loading ? 'Checking...' : 'Check Server Cookies'}
            </button>
            
            {cookieCheckResponse && (
              <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
                {JSON.stringify(cookieCheckResponse, null, 2)}
              </pre>
            )}
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Server-side Auth Test:</h2>
            <button 
              onClick={testServerAuth}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2 mr-2"
            >
              {loading ? 'Testing...' : 'Test Server Auth'}
            </button>
            
            {serverAuthResponse && (
              <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
                {JSON.stringify(serverAuthResponse, null, 2)}
              </pre>
            )}
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Instructions:</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>If you see user data and token, client-side auth is working</li>
              <li>If you see auth_token in cookies, the cookie is being set correctly</li>
              <li>If isAuthenticated is false, there might be an issue with auth initialization</li>
              <li>Use &quot;Check Server Cookies&quot; to see what cookies the server receives</li>
              <li>Use &quot;Test Server Auth&quot; to check if the server can read the auth cookie</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
