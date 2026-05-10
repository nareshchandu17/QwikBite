'use client';

import dynamic from 'next/dynamic';

// Dynamically import the OrdersPage component with no SSR
const OrdersPage = dynamic(
  () => import('@/components/admin/OrdersPage'),
  { ssr: false }
);

export default function OrdersAdminPage() {
  return <OrdersPage />;
}
