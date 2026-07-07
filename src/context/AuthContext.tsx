'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import { signOut as nextAuthSignOut, useSession, signIn } from 'next-auth/react';

// Client-safe JWT payload decoder (extracts metadata without requiring server-only verification)
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode base64url payload safely in browser
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[AuthContext] Error decoding custom token payload:', error);
    return null;
  }
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  regNo?: string;
  role: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => false,
  logout: async () => { },
  isAuthenticated: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialSync, setIsInitialSync] = useState(true);

  // Sync context with NextAuth session and custom token
  useEffect(() => {
    const syncAuth = async () => {
    console.log('[AuthContext] Auth sync effect running:', {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      sessionId: session?.user?.id
    });

    if (status === 'loading') return;

    // Check NextAuth session first
    if (session?.user) {
      console.log('[AuthContext] Found NextAuth session, setting user:', session.user);
      setUser({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role || 'customer',
        image: (session.user as { image?: string }).image || '',
      } as User);
      setIsAuthenticated(true);
      // For NextAuth JWT strategy, we need to get the JWT token
      // The token is stored in a secure cookie, but we can access it via getAccessToken
      console.log('[AuthContext] NextAuth session found, attempting to get JWT token...');
      
      // Try to get the NextAuth JWT token
      try {
        // For NextAuth, the JWT token is stored in a secure HttpOnly cookie
        // We need to make a request to get it, or use the session data
        // For now, we'll set isAuthenticated based on session presence
        // The API will handle token verification via cookies
        console.log('[AuthContext] NextAuth authentication established via session');
      } catch (error) {
        console.log('[AuthContext] Could not get NextAuth token:', error);
      }
    } else {
      console.log('[AuthContext] No NextAuth session, checking custom token...');
      // If no NextAuth session, check for custom token
      try {
        // Get token from cookie (server-side) or localStorage (client-side)
        let authToken = null;
        
        // Try to get from cookie first (works in server components)
        if (typeof window === 'undefined') {
          // Server-side - we'd need to pass the request, but for now skip
        } else {
          // Client-side - check localStorage first, then try to get from cookie
          authToken = localStorage.getItem('token') || localStorage.getItem('auth_token');
          
          if (!authToken) {
            // Try to get from document.cookie
            const cookies = document.cookie.split(';');
            const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
            if (authCookie) {
              authToken = authCookie.split('=')[1];
            }
          }
        }

        if (authToken) {
          console.log('[AuthContext] Found auth token, decoding payload:', authToken.substring(0, 20) + '...');
          const decoded = decodeJwtPayload(authToken);
          console.log('[AuthContext] Token decoding result:', decoded);
          if (decoded?.id) {
            console.log('[AuthContext] Token payload parsed, setting user:', decoded);
            setUser({
              id: decoded.id,
              name: decoded.name || '',
              email: decoded.email || '',
              role: decoded.role || 'customer',
              regNo: decoded.regNo,
            } as User);
            setIsAuthenticated(true);
            setToken(authToken);
            return;
          } else {
            console.log('[AuthContext] Token verification failed - invalid token');
          }
        } else {
          console.log('[AuthContext] No auth token found in localStorage or cookies');
        }
      } catch (error) {
        console.warn('Failed to verify custom token:', error);
      }

      // No authentication found
      console.log('[AuthContext] No authentication found, setting auth state to false');
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
    }
    
    console.log('[AuthContext] Auth sync completed:', {
      isAuthenticated,
      hasUser: !!user,
      hasToken: !!token,
      userEmail: user?.email
    });
    };
    
    syncAuth().finally(() => {
      setIsInitialSync(false);
    });
  }, [session, status]);

  const router = useRouter();

  /**
   * 🔹 LOGIN
   * Legacy support: Ideally use signIn() from next-auth directly.
   * This function now mainly ensures local state is set optimistically if needed.
   */
  const login = useCallback(
    async (userData: User, userToken?: string): Promise<boolean> => {
      try {
        console.warn('Using legacy login context method. Prefer signIn() from next-auth/react.');
        setUser(userData);
        setIsAuthenticated(true);

        if (userToken) {
          setToken(userToken);
          localStorage.setItem('token', userToken);
        }

        return true;
      } catch (err) {
        console.error('Login error:', err);
        return false;
      }
    },
    []
  );

  /**
   * 🔹 LOGOUT
   * Signs out from NextAuth and clears state.
   * Uses window.location.replace for complete state reset and navigation to root.
   */
  const logout = useCallback(async () => {
    try {
      // Sign out from NextAuth without redirect to handle it manually
      await nextAuthSignOut({ redirect: false });
      
      // Clear all local state
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force navigation to root page with location.replace to prevent back navigation
      window.location.replace('/');
    } catch (err) {
      console.error('Logout error:', err);
      // Even if NextAuth signout fails, clear state and redirect
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      isAuthenticated,
      loading: (status === 'loading' && !isAuthenticated) || isInitialSync,
    }),
    [user, token, login, logout, isAuthenticated, status, isInitialSync]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
