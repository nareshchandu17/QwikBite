'use client';
/**
 * Role Guard Utility Functions
 * Used to check user roles for conditional rendering and access control
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  regNo?: string;
  image?: string;
}

/**
 * Check if user is a customer
 */
export function isCustomer(user: User | null): boolean {
  return user?.role === 'customer';
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if user is a canteen staff
 */
export function isCanteenStaff(user: User | null): boolean {
  return user?.role === 'canteen_staff';
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(user: User | null, ...roles: string[]): boolean {
  return user ? roles.includes(user.role) : false;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user: User | null): boolean {
  return user !== null && user !== undefined;
}
import { useCustomerGuard as useCustomerGuardHook } from '@/hooks/use-customer-guard';
import { useAdminGuard as useAdminGuardHook } from '@/hooks/use-admin-guard';
export const useCustomerGuard = useCustomerGuardHook;
export const useAdminGuard = useAdminGuardHook;
