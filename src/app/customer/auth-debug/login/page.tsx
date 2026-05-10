'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Dynamically import the SignIn component to avoid SSR issues
const SignIn = dynamic(() => import('../../signin/page'), { ssr: false });

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the signin page directly
    router.replace('/signin');
  }, [router]);

  // While redirecting, show a simple loading message
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to sign in page...</p>
      </div>
    </div>
  );
}