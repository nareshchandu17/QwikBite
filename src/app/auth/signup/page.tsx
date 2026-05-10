'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/context/AuthModalContext';
import { useAuth } from '@/context/AuthContext';

export default function SignUpPage() {
  const router = useRouter();
  const { openModal } = useAuthModal();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect them
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/customer';
      router.replace(redirectPath);
      return;
    }

    // Open the sign up modal
    openModal('signup');
    
    // Add a slight delay to ensure modal opens before potential redirect
    const timer = setTimeout(() => {
      // If for some reason modal doesn&apos;t open, redirect to home
      if (!document.querySelector('[role="dialog"]')) {
        router.push('/');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, openModal, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-amber-700">Opening sign up...</p>
      </div>
    </div>
  );
}
