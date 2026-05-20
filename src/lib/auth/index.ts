import 'server-only';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { serialize, parse } from 'cookie';

// Parse cookies from cookie header string
export function parseCookies(cookieHeader?: string | null): Record<string, string> {
  const res: Record<string, string> = {};
  if (!cookieHeader) return res;
  const cookies = cookieHeader.split(';');
  for (const c of cookies) {
    const [k, ...v] = c.trim().split('=');
    res[k] = decodeURIComponent(v.join('='));
  }
  return res;
}
const _safeGet = (_obj: unknown, _path: string[], defaultValue: unknown = null) => {
  try {
    return _path.reduce((acc: any, key) => (acc && acc[key] !== undefined ? acc[key] : defaultValue), _obj);
  } catch {
    return defaultValue;
  }
};

// Helper to safely check if we're in a browser environment
const _isBrowser = () => {
  try {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  } catch {
    return false;
  }
};

// Safe console logging
const _safeConsoleError = (..._args: unknown[]) => {
  if (!_isBrowser()) return;

  try {
    const browserConsole = window.console;
    if (browserConsole && typeof browserConsole.error === 'function') {
      try {
        browserConsole.error(..._args);
      } catch (_error) {
        // If structured logging fails, try stringifying
        try {
          browserConsole.error(_args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' '));
        } catch (_error) {
          // Last resort - do nothing
        }
      }
    }
  } catch (_error) {
    // Do nothing if anything fails
  }
};

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('❌ JWT_SECRET must be set in production environment');
  }
  console.warn('⚠️ JWT_SECRET is not set. Using a temporary secret for development.');
}

const FINAL_SECRET = JWT_SECRET || 'dev-only-fallback-secret-6723-4567-8901';
const TOKEN_NAME = 'auth_token';
const TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role?: string;
  regNo?: string;
  exp?: number;
  iat?: number;
}

export const generateToken = (payload: JwtPayload): string => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Generating token with FINAL_SECRET:', {
      hasEnvSecret: !!process.env.JWT_SECRET,
      secretLength: FINAL_SECRET.length,
      secretPreview: FINAL_SECRET.substring(0, 10) + '...',
    });
  }
  return jwt.sign(payload, FINAL_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string): JwtPayload | null => {
  console.log('[verifyToken] Verifying token:', token ? token.substring(0, 20) + '...' : 'No token');

  if (!token || typeof token !== 'string') {
    console.log('[verifyToken] Invalid token format or no token');
    return null;
  }

  try {
    // Simple verification without any external dependencies
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('[verifyToken] Invalid JWT structure - not 3 parts');
      return null;
    }

    // Use a try-catch that can't fail
    let decoded;
    try {
      decoded = jwt.verify(token, FINAL_SECRET) as JwtPayload;
      console.log('[verifyToken] Token verification successful:', decoded);
    } catch (_error) {
      console.log('[verifyToken] JWT verification failed:', _error);
      return null;
    }

    // Basic validation
    if (!decoded || typeof decoded !== 'object' || !decoded.id || !decoded.email) {
      return null;
    }

    // Check expiration if exists
    if (decoded.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        return null;
      }
    }

    return decoded;
  } catch (_error) {
    // If anything goes wrong, fail closed
    return null;
  }
};

export const getTokenFromRequest = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// Cookie-based authentication functions with enhanced security
export const setAuthCookie = (token: string, res: NextResponse) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Only secure in production
    maxAge: TOKEN_MAX_AGE,
    path: '/',
    sameSite: 'lax' as const,
    // Don't set domain in development to avoid issues
    domain: isProduction ? undefined : undefined,
  };

  const cookie = serialize(TOKEN_NAME, token, cookieOptions);

  res.headers.set('Set-Cookie', cookie);

  // Log cookie for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Setting auth cookie:', {
      tokenLength: token.length,
      cookieOptions,
      cookieString: cookie, // Log the actual cookie string
    });
  }
};

export const getAuthCookie = (req: NextRequest): string | undefined => {
  const cookieHeader = req.headers.get('cookie');

  // Log cookie header for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Reading cookies from request:', {
      hasCookieHeader: !!cookieHeader,
      cookieHeaderLength: cookieHeader?.length,
      userAgent: req.headers.get('user-agent'),
      host: req.headers.get('host'),
      cookieHeader: cookieHeader, // Log the actual cookie header
    });
  }

  if (!cookieHeader) {
    return undefined;
  }

  const cookies = parse(cookieHeader);
  const token = cookies[TOKEN_NAME];

  if (process.env.NODE_ENV === 'development') {
    console.log('Parsed auth cookie:', {
      hasToken: !!token,
      tokenLength: token?.length,
      token: token, // Log the actual token
    });
  }

  return token;
};

export const clearAuthCookie = (res: NextResponse) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Only secure in production
    maxAge: 0,
    path: '/',
    sameSite: 'lax' as const,
    // Don't set domain in development to avoid issues
    domain: isProduction ? undefined : undefined,
  };

  const cookie = serialize(TOKEN_NAME, '', cookieOptions);

  res.headers.set('Set-Cookie', cookie);
};
