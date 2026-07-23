"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveOrdersQueue from './LiveOrdersQueue';
import { Order, OrderStatus } from '@/types';
import { websocketClient } from '@/lib/websocket';
import { toast } from 'sonner';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('-1');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [enableBulkActions, setEnableBulkActions] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const fetchOrders = useCallback(async (isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      
      const params = new URLSearchParams({
        page: isLoadMore ? String(page) : '1',
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/admin/orders?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      
      if (isLoadMore) {
        setOrders(prev => [...prev, ...(data.data || [])]);
      } else {
        setOrders(data.data || []);
      }
      
      setHasMore(data.pagination?.hasMore || false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, sortOrder, page]);

  useEffect(() => {
    // Initialize admin socket and join admin channel
    websocketClient.connect('/admin');
    websocketClient.joinRoom('admin');
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh as fallback (every 30 seconds if WebSocket is disconnected)
  useEffect(() => {
    if (isConnected) return;

    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, fetchOrders]);

  // Listen for real-time updates
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      console.log('WebSocket connected to admin channel');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected from admin channel');
    };

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

    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);
    websocketClient.on('admin:new_order', handleNewOrder);
    websocketClient.on('admin:order_updated', handleOrderUpdate);

    return () => {
      websocketClient.off('connect', handleConnect);
      websocketClient.off('disconnect', handleDisconnect);
      websocketClient.off('admin:new_order', handleNewOrder);
      websocketClient.off('admin:order_updated', handleOrderUpdate);
    };
  }, []);

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
      toast.error((err as any).message || 'Failed to update status');
    }
  };

  const handleUpdateNote = async (orderId: string, note: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, note }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add note');
      }

      return true;
    } catch (err: unknown) {
      console.error('Failed to add note', err);
      throw err;
    }
  };

  const handleBulkAction = async (orderIds: string[], action: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, orderIds, status: action }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to perform bulk action');
      }

      const data = await res.json();
      toast.success(`Bulk action completed: ${data.successCount} orders updated`);
      if (data.errorCount > 0) {
        toast.error(`${data.errorCount} orders failed to update`);
      }
      fetchOrders();
    } catch (err: unknown) {
      console.error('Failed to perform bulk action', err);
      toast.error((err as any).message || 'Failed to perform bulk action');
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchOrders(true);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchOrders();
    toast.success('Orders refreshed');
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      });

      const res = await fetch(`/api/admin/orders/export-csv?${params}`);
      if (!res.ok) throw new Error('Failed to export orders');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Orders exported successfully');
    } catch (error) {
      console.error('Failed to export orders:', error);
      toast.error('Failed to export orders');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Order Management</h1>
          <p className="text-[#9ca3af] mt-1 font-medium">Control the kitchen flow with real-time order tracking.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs font-black uppercase tracking-widest">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs transition-all"
          >
            Export CSV
          </button>
          <button
            onClick={() => setEnableBulkActions(!enableBulkActions)}
            className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${enableBulkActions ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            {enableBulkActions ? 'Bulk Mode On' : 'Bulk Mode'}
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-xs transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by order ID or customer name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
        />
        
        {/* Custom Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="px-4 py-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white hover:from-white/20 hover:to-white/10 transition-all flex items-center gap-2"
          >
            <span className="text-sm font-medium">Sort by</span>
            <motion.span
              animate={{ rotate: sortDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.span>
          </button>
          
          <AnimatePresence>
            {sortDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-1">
                  {[
                    { value: 'createdAt', label: 'Date' },
                    { value: 'totalAmount', label: 'Amount' },
                    { value: 'status', label: 'Status' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setPage(1);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-all ${
                        sortBy === option.value
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {option.label}
                      {sortBy === option.value && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="float-right text-blue-400"
                        >
                          ✓
                        </motion.span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button
          onClick={() => setSortOrder(prev => prev === '-1' ? '1' : '-1')}
          className="px-4 py-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white hover:from-white/20 hover:to-white/10 transition-all"
        >
          {sortOrder === '-1' ? '↓' : '↑'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          {loading ? (
            <div className="space-y-4">
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
            <>
              <LiveOrdersQueue 
                orders={orders} 
                onUpdateStatus={handleUpdateStatus} 
                onUpdateNote={handleUpdateNote}
                enableBulkActions={enableBulkActions}
                onBulkAction={handleBulkAction}
              />
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  className="w-full mt-4 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-sm transition-all"
                >
                  Load More Orders
                </button>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl">
            <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4">Queue Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Active Orders</span>
                <span className="text-2xl font-black text-white">{orders.filter(o => !['cancelled', 'completed'].includes(o.status)).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Pending</span>
                <span className="text-xl font-black text-blue-400">{orders.filter(o => o.status === 'pending').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Confirmed</span>
                <span className="text-xl font-black text-purple-400">{orders.filter(o => o.status === 'confirmed').length}</span>
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
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-black text-green-500 tracking-widest uppercase">
                {isConnected ? 'WebSocket Active' : 'WebSocket Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
