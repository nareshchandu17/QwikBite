import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Public pages (no authentication required)
 */
const publicRoutes = [
  '/',
  '/signin',
  '/signup',
  '/menu',
  '/unauthorized',
];

/**
 * Role-based protected routes
 */
const adminRoutes = ['/admin', '/admincanteen'];
const customerRoutes = ['/customer'];

/**
 * Routes that should NOT be accessible by authenticated users
 * (They will be redirected to their respective dashboards)
 */
const authOnlyRoutes = [
  '/',
  '/signin',
  '/signup',
  '/auth/signin',
  '/auth/signup',
  '/customer/signin',
  '/customer/signup',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ------------------------------------------------------------------
   * ✅ Allow Next.js internals & static files
   * ------------------------------------------------------------------ */
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  /* ------------------------------------------------------------------
   * 🔐 Authenticated routes
   * ------------------------------------------------------------------ */
  const secret = process.env.NEXTAUTH_SECRET;
  const authSecret = secret;
  if (!authSecret && process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET is required in production');
  }
  const token = await getToken({ 
    req, 
    secret: authSecret || 'development-fallback-key-only-for-local' 
  });

  const isAuthenticated = Boolean(token);
  const userRole = (token?.role as string | undefined)?.toLowerCase();

  const isAuthOnlyRoute = authOnlyRoutes.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isPublicRoute = publicRoutes.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Define Admin API prefixes
  const adminApiPrefixes = [
    '/api/admin',
    '/api/admincanteen',
    '/api/staff',
    '/api/staffmanagement',
    '/api/system-notifications',
    '/api/transactions',
    '/api/test',
    '/api/debug'
  ];


  const isAdminApi = adminApiPrefixes.some(prefix => pathname.startsWith(prefix));

  /* ------------------------------------------------------------------
   * 🛡️ API PROTECTION (CRITICAL)
   * ------------------------------------------------------------------ */
  if (isAdminApi) {
    // Special case: Allow POST to /api/transactions for payment success callbacks
    if (pathname === '/api/transactions' && req.method === 'POST') {
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (userRole !== 'admin' && userRole !== 'canteen_staff') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    return NextResponse.next();
  }


  // Allow other APIs to pass through (individual route handlers can still use verifyAuth)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  /* ------------------------------------------------------------------
   * 🔄 Case 1: Authenticated
   * ------------------------------------------------------------------ */
  if (isAuthenticated) {
    // Redirect away from auth-only routes (/, /signin, etc)
    if (isAuthOnlyRoute) {
      if (userRole === 'admin' || userRole === 'canteen_staff') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      } else {
        return NextResponse.redirect(new URL('/customer', req.url));
      }
    }

    // Protection for Admin Page routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== 'admin' && userRole !== 'canteen_staff') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    // Protection for Customer Page routes
    if (customerRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== 'customer') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    return NextResponse.next();
  }

  /* ------------------------------------------------------------------
   * 🔄 Case 2: Not Authenticated
   * ------------------------------------------------------------------ */

  // Allow public routes and auth-only routes
  if (isPublicRoute || isAuthOnlyRoute) {
    return NextResponse.next();
  }

  // Otherwise, redirect to signin
  const signInUrl = new URL('/signin', req.url);
  signInUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(signInUrl);
}

/**
 * Run middleware on all routes except static assets
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};

