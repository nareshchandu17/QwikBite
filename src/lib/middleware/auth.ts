import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { verifyToken, getAuthCookie, getTokenFromRequest } from '@/lib/auth';

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
  error?: string;
  code?: string;
}

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
if (!NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET is required in production');
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // 1. Try NextAuth session first (Production standard)
    const nextAuthToken = await getToken({ 
      req: request, 
      secret: NEXTAUTH_SECRET 
    });

    if (nextAuthToken) {
      return {
        success: true,
        user: {
          id: (nextAuthToken.id as string) || (nextAuthToken.sub as string),
          email: nextAuthToken.email as string,
          role: (nextAuthToken.role as string) || 'customer',
          name: nextAuthToken.name as string
        }
      };
    }

    // 2. Fallback to custom JWT (for backward compatibility/custom clients)
    const customToken = getTokenFromRequest(request) || getAuthCookie(request);

    if (customToken) {
      const decoded = verifyToken(customToken);

      if (decoded) {
        return {
          success: true,
          user: {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role || 'customer',
            name: decoded.name
          }
        };
      }
    }

    return {
      success: false,
      error: 'Authentication required',
      code: 'UNAUTHENTICATED'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    };
  }
}

export function createSecureResponse(authResult: AuthResult, status: number = 401): NextResponse {
  return NextResponse.json({
    success: false,
    error: authResult.error || 'Unauthorized',
    code: authResult.code || 'UNAUTHORIZED'
  }, { status });
}
