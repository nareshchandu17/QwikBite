"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

export function useAdminGuard() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const currentPath =
        typeof window !== "undefined"
          ? window.location.pathname
          : "/admin/dashboard";
      router.push(
        "/signin?callbackUrl=" + encodeURIComponent(currentPath),
      );
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role && !STAFF_ROLES.has(user.role)) {
      router.replace("/unauthorized");
    }
  }, [isAuthenticated, loading, user, router]);

  return {
    isAuthenticated,
    loading,
    isAdmin: Boolean(user?.role && STAFF_ROLES.has(user.role)),
  };
}
