"use client"
import React, { useState, useEffect } from 'react';
import LiveOrdersQueue from './LiveOrdersQueue';
import { Order, OrderStatus } from '@/types';
import { websocketClient } from '@/lib/websocket';
import { toast } from 'sonner';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize admin socket
    websocketClient.connect('/admin');
  }, []);


  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!websocketClient.isConnected) return;

    const handleNewOrder = (newOrder: Order) => {
      console.log('Admin received new order via socket:', newOrder.id);
      toast.info(`New Order received!`);
      setOrders(prev => [newOrder, ...prev]);
    };

    const handleOrderUpdate = (updatedOrder: Order) => {
      console.log('Admin received order update via socket:', updatedOrder.id, updatedOrder.status);
      setOrders(prev =>
        prev.map(o => (o.id === updatedOrder.id || (o as any)._id === (updatedOrder as any)._id) ? updatedOrder : o)
      );
    };

    const handleCustomerTracking = (data: unknown) => {
      console.log('Customer started tracking order:', data.orderId);
      toast.info(`Customer is tracking order #${data.orderId.split('-').pop()}`);
    };

    const handleCustomerStoppedTracking = (data: unknown) => {
      console.log('Customer stopped tracking order:', data.orderId);
    };

    websocketClient.on('admin:new_order', handleNewOrder);
    websocketClient.on('admin:order_updated', handleOrderUpdate);

    // Note: customer:tracking and other events would also be handled via websocketClient.on
    // but they need to be added to the EventMap if we want type safety.

    return () => {
      websocketClient.off('admin:new_order', handleNewOrder);
      websocketClient.off('admin:order_updated', handleOrderUpdate);
    };

  }, [websocketClient.isConnected]);

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      toast.success(`Order marked as ${status}`);
    } catch (err: unknown) {
      console.error('Failed to update status', err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  return (

    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight">Order Management</h1>
        <p className="text-[#9ca3af] mt-1 font-medium">Control the kitchen flow with real-time order tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          {loading ? (
            <div className="space-y-4">
              {/* Order Card Skeletons */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-xl animate-pulse"></div>
                      <div>
                        <div className="h-5 w-32 bg-gray-700 rounded animate-pulse mb-2"></div>
                        <div className="h-3 w-24 bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-gray-700 rounded-full animate-pulse"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="h-4 w-28 bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="h-8 w-16 bg-gray-700 rounded-lg animate-pulse"></div>
                      <div className="h-8 w-16 bg-gray-700 rounded-lg animate-pulse"></div>
                      <div className="h-8 w-16 bg-gray-700 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="h-8 w-20 bg-gray-700 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <LiveOrdersQueue orders={orders} onUpdateStatus={handleUpdateStatus} />
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl">
            <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4">Queue Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Active Orders</span>
                <span className="text-2xl font-black text-white">{orders.filter(o => !['cancelled', 'delivered', 'collected'].includes(o.status)).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Received</span>
                <span className="text-xl font-black text-blue-400">{orders.filter(o => o.status === 'received').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Preparing</span>
                <span className="text-xl font-black text-yellow-400">{orders.filter(o => o.status === 'preparing').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Ready</span>
                <span className="text-xl font-black text-green-400">{orders.filter(o => o.status === 'ready').length}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/20 backdrop-blur-xl shadow-2xl">
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Status Sync</p>
            <h3 className="text-lg font-bold text-white mb-2">Real-Time Engine</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              All status changes are instantly broadcasted to customer devices. No page refresh required.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-green-500 tracking-widest uppercase">WebSocket Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
