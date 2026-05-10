'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthModal } from '@/context/AuthModalContext';
import { useAuth } from '@/context/AuthContext';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openModal } = useAuthModal();
  const { isAuthenticated } = useAuth();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    // Always open the sign in modal on this page
    console.log('Opening sign in modal...');
    openModal('signin', callbackUrl);
  }, [openModal, callbackUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-amber-700">Loading authentication...</p>
      </div>
    </div>
  );
}