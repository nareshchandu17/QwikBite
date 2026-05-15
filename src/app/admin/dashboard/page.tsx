'use client';

import { useState, useEffect } from 'react';
import DashboardOverview from '@/components/admin/DashboardOverview';
import { Order, OrderStatus } from '@/types/order';
import { useAdminGuard } from '@/hooks/use-admin-guard';

export default function DashboardPage() {
  const { isAuthenticated, loading, isAdmin } = useAdminGuard();
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  // Fetch real orders from API
  useEffect(() => {
    // Define fetchOrders function outside the if block
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/admin/orders');
        if (response.ok) {
          const data = await response.json();
          // Transform the data to match the Order type if needed
          const transformedOrders = data.data || data || [];
          setOrders(transformedOrders);
        } else {
          console.error('Failed to fetch orders');
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    // Only fetch if user is authenticated (admin guard ensures they're admin)
    if (!loading && isAuthenticated) {
      fetchOrders();
    }

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      if (!loading && isAuthenticated) {
        fetchOrders();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loading, isAuthenticated]);

  // Function to update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Update local state immediately for better UX
      setOrders(orders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            statusHistory: [
              ...(order.statusHistory || []),
              {
                status: newStatus,
                timestamp: new Date().toISOString(),
                message: `Status updated to ${newStatus}`
              }
            ]
          };
        }
        return order;
      }));

      // Update in database
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });

      if (!response.ok) {
        console.error('Failed to update order status');
        // Revert local state if API call fails
        setOrders(orders);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      // Revert local state if API call fails
      setOrders(orders);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You Don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (ordersLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-20 bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-3 w-24 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Orders Table Skeleton */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
          <div className="p-6 border-b border-white/20">
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg animate-pulse"></div>
                    <div>
                      <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-32 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-6 w-20 bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardOverview orders={orders} onUpdateStatus={updateOrderStatus} />
    </div>
  );
}
