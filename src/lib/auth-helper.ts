import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authConfig } from '@/auth';
import { getAuthCookie, verifyToken } from '@/lib/auth';

/**
 * Robust helper to get the authenticated user's ID and Email from multiple potential sources:
 * 1. NextAuth Session
 * 2. Custom JWT Cookie (auth_token)
 * 3. Authorization Header (Bearer token)
 * 4. NextAuth JWT Token (direct)
 */
export async function getAuthenticatedUser(req: Request | NextRequest) {
  try {
    // Convert to NextRequest if needed for getToken
    const nextReq = req instanceof Request ? new NextRequest(req.url, { headers: req.headers }) : req;

    // 1. Try NextAuth Session
    const session = await getServerSession(authConfig);
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        source: 'next-auth-session'
      };
    }

    // 2. Try Custom JWT Cookie
    const authCookie = getAuthCookie(nextReq);
    if (authCookie) {
      const decoded = verifyToken(authCookie);
      if (decoded?.id || decoded?.email) {
        return {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          source: 'custom-jwt-cookie'
        };
      }
    }

    // 3. Try Authorization Header
    const authHeader = nextReq.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const headerToken = authHeader.substring(7);
      const decoded = verifyToken(headerToken);
      if (decoded?.id || decoded?.email) {
        return {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          source: 'auth-header'
        };
      }
    }

    // 4. Try getToken (NextAuth JWT fallback)
    const token = await getToken({
      req: nextReq,
      secret: process.env.NEXTAUTH_SECRET || 'development-fallback-key-only-for-local',
    });

    if (token) {
      return {
        id: (token.id || token.sub) as string,
        email: token.email as string,
        role: token.role as string,
        source: 'next-auth-token'
      };
    }

    return null;
  } catch (error) {
    console.error('[AuthHelper] Error getting authenticated user:', error);
    return null;
  }
}
