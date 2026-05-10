'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isCustomer } from '@/lib/auth/roleGuard';

export default function TestAuthFixPage() {
  const { user, token, isAuthenticated } = useAuth();
  const router = useRouter();
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    // Test the authentication state
    const testAuth = () => {
      if (!isAuthenticated) {
        setTestResult('User is not authenticated');
        return;
      }
      
      if (!user) {
        setTestResult('User object is null');
        return;
      }
      
      const roleCheck = isCustomer(user);
      setTestResult(`User is authenticated. Role: ${user.role || 'undefined'}, isCustomer: ${roleCheck}`);
      
      // If user is authenticated and is a customer, redirect to orders page
      if (roleCheck) {
        router.push('/orders');
      }
    };
    
    testAuth();
  }, [user, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Auth State:</h2>
            <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
              {JSON.stringify({ user, token, isAuthenticated }, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Test Result:</h2>
            <p className="bg-gray-100 p-4 rounded mt-2">{testResult}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Instructions:</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>If you see user data and token, client-side auth is working</li>
              <li>If isAuthenticated is true and isCustomer is true, you should be redirected to orders</li>
              <li>If you&apos;re still seeing this page, there might be an issue with the role checking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}