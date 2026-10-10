import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/", "/signin", "/signup", "/customer/menu", "/unauthorized"];
const adminRoutes = ["/admin", "/admincanteen"];
const customerRoutes = ["/customer"];
const authOnlyRoutes = ["/", "/signin", "/signup", "/auth/signin", "/auth/signup", "/customer/signin", "/customer/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const authSecret = process.env.NEXTAUTH_SECRET;
  if (!authSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "NEXTAUTH_SECRET is required in production" }, { status: 503 });
  }

  const token = await getToken({ req, secret: authSecret || "development-fallback-key-only-for-local" });
  const isAuthenticated = Boolean(token);
  const userRole = String(token?.role || "").toLowerCase();

  const matchesRoute = (route: string) =>
    route === "/"
      ? pathname === "/"
      : pathname === route || pathname.startsWith(route + "/");

  const isAuthOnlyRoute = authOnlyRoutes.some(matchesRoute);
  const isPublicRoute = publicRoutes.some(matchesRoute);
  const adminApiPrefixes = ["/api/admin", "/api/admincanteen", "/api/staff", "/api/staffmanagement", "/api/system-notifications", "/api/transactions", "/api/test", "/api/debug"];
  const isAdminApi = adminApiPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isAdminApi) {
    if (!isAuthenticated) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!["admin", "canteen_staff", "staff"].includes(userRole)) return NextResponse.json({ error: "Forbidden: staff access required" }, { status: 403 });
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) return NextResponse.next();

  if (isAuthenticated) {
    if (isAuthOnlyRoute) {
      const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
      if (callbackUrl && callbackUrl !== "/" && !authOnlyRoutes.some((route) => callbackUrl === route || callbackUrl.startsWith(route + "/"))) {
        return NextResponse.redirect(new URL(callbackUrl, req.url));
      }
      return NextResponse.redirect(new URL(["admin", "canteen_staff", "staff"].includes(userRole) ? "/admin/dashboard" : "/customer", req.url));
    }
    if (adminRoutes.some(matchesRoute) && !["admin", "canteen_staff", "staff"].includes(userRole)) return NextResponse.redirect(new URL("/unauthorized", req.url));
    if (customerRoutes.some(matchesRoute) && !["customer"].includes(userRole)) return NextResponse.redirect(new URL("/unauthorized", req.url));
    return NextResponse.next();
  }

  if (isPublicRoute || isAuthOnlyRoute) return NextResponse.next();
  const signInUrl = new URL("/signin", req.url);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"] };