'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const isAdmin = user?.role === 'admin';

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    signIn: (email: string, password: string) => 
      signIn('credentials', { 
        email, 
        password,
        redirect: true,
        callbackUrl: '/',
      }),
    signOut: () => signOut({ callbackUrl: '/signin' }),
  };
}
