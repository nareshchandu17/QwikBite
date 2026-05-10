'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';

import Sidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/AdminHeader';

import {
  AnalyticsIcon,
  DashboardIcon,
  FeedbackIcon,
  InventoryIcon,
  MenuIcon,
  OrdersIcon,
  PaymentsIcon,
  SettingsIcon,
  SlotsIcon,
  StaffIcon,
} from '@/components/admin/icons';

/* ----------------------------- NAV ITEMS ----------------------------- */

const navItems = [
  { name: 'Dashboard Overview', path: '/admin/dashboard', icon: DashboardIcon },
  { name: 'Orders', path: '/admin/orders', icon: OrdersIcon },
  { name: 'Slots & Timings', path: '/admin/slots', icon: SlotsIcon },
  { name: 'Menu Management', path: '/admin/menu', icon: MenuIcon },
  { name: 'Inventory & Stock Alerts', path: '/admin/inventory', icon: InventoryIcon },
  { name: 'Payments', path: '/admin/payments', icon: PaymentsIcon },
  { name: 'Analytics & Insights', path: '/admin/analytics', icon: AnalyticsIcon },
  { name: 'Customer Feedback', path: '/admin/feedback', icon: FeedbackIcon },
  { name: 'Canteen Staff Management', path: '/admin/staff', icon: StaffIcon },
  { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
];

/* ----------------------------- LAYOUT ----------------------------- */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  /* ----------------------------- AUTH GUARD ----------------------------- */
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/signin?callbackUrl=/admin/dashboard');
      return;
    }

    if (session.user.role !== 'admin' && session.user.role !== 'canteen_staff') {
      router.push('/customer');
    }
  }, [session, status, router]);

  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (session.user.role !== 'admin' && session.user.role !== 'canteen_staff') {
    return null;
  }

  /* ----------------------------- ACTIVE TAB ----------------------------- */
  const activeTab =
    navItems.find(item => pathname?.startsWith(item.path))?.name ||
    'Dashboard Overview';

  /* ----------------------------- RENDER ----------------------------- */

  return (
    <div className="flex min-h-screen bg-black">

      {/* ================= Sidebar ================= */}
      <Sidebar
        activeTab={activeTab}
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(prev => !prev)}
      />

      {/* ================= Main Content ================= */}
      <main className="relative flex-1 overflow-y-auto">

        {/* Background (SCOPED — FIXES YOUR ISSUE) */}
        <div className="absolute inset-0 bg-[#050505] pointer-events-none" />

        {/* Content Layer */}
        <div className="relative z-10 min-h-screen text-white">

          {/* Header */}
          <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-gray-800">
            <AdminHeader
              title={activeTab}
              subtitle={`Manage ${activeTab}`}
            />
          </div>

          {/* Page Content */}
          <div className="p-8 min-h-[calc(100vh-80px)]">
            {children}
          </div>

        </div>
      </main>

      {/* ================= Utilities ================= */}
      <Toaster />
    </div>
  );
}
