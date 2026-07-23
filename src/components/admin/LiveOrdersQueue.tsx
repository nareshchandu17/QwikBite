import React, { useState } from 'react';
import { Order, OrderStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import OrderDetailsModal from './OrderDetailsModal';
import { menuItems } from '@/data/menu';

const getStatusStyles = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    case 'confirmed': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
    case 'preparing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'ready': return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};

const getPaymentStatusStyles = (paymentStatus?: string) => {
  switch (paymentStatus) {
    case 'paid': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'pending': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'failed': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'refunded': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
};

const formatStatus = (status: OrderStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
};

const getMenuImageForItem = (itemName: string): string | null => {
  const normalized = itemName?.toLowerCase().trim();
  if (!normalized) return null;

  // Try exact match first
  let menuItem = menuItems.find((item) => item.name.toLowerCase() === normalized);
  
  // If no exact match, try partial match
  if (!menuItem) {
    menuItem = menuItems.find((item) =>
      normalized.includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(normalized)
    );
  }

  return menuItem?.image || null;
};

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onOpenDetails: (order: Order) => void;
  enableBulkActions?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus, onOpenDetails, enableBulkActions, isSelected, onToggleSelect }) => {
  const firstItem = order.items[0];
  
  // Handle image URL construction - check multiple possible image sources
  const getImageUrl = () => {
    // First try to match from menu (this is the real image)
    const menuImage = getMenuImageForItem(firstItem?.name);
    if (menuImage) {
      return menuImage;
    }
    
    // Try different possible image locations
    const possibleImages = [
      firstItem?.image,
      firstItem?.imageUrl,
      (firstItem?.menuItem as any)?.image,
      (firstItem?.menuItem as any)?.imageUrl,
      (firstItem as any)?.thumbnail,
    ].filter(Boolean);

    for (const img of possibleImages) {
      if (!img) continue;
      
      // If it's already a full URL, return as is
      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img;
      }
      
      // If it starts with /, it's a relative path to public folder
      if (img.startsWith('/')) {
        return img;
      }
      
      // Otherwise, prepend /
      return `/${img}`;
    }
    
    // Return fallback image from public folder
    return '/images/order.jpg';
  };

  const itemThumbnail = getImageUrl();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6
            bg-white/[0.03] hover:bg-white/[0.06]
            backdrop-blur-md border border-white/10
            shadow-xl transition-all duration-300 ${isSelected ? 'border-blue-500/50 bg-blue-500/10' : ''}`}
    >
      {/* Bulk Selection Checkbox */}
      {enableBulkActions && (
        <div className="flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect?.(order.id)}
            className="w-5 h-5 rounded border-2 border-white/30 bg-white/10 checked:bg-blue-500 checked:border-blue-500 cursor-pointer"
          />
        </div>
      )}
      {/* Thumbnail */}
      <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
        <img
          src={itemThumbnail}
          alt="Order"
          className="w-full h-full rounded-xl object-cover shadow-2xl transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            console.error('Image failed to load:', itemThumbnail);
            (e.target as HTMLImageElement).src = '/images/order.jpg';
          }}
        />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <button
            onClick={() => onOpenDetails(order)}
            className="text-xs font-black tracking-widest uppercase text-white/40 hover:text-white transition-colors"
          >
            #{(order.id || (order as any)._id)?.split('-').pop() || 'ORDER'}
          </button>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border ${getStatusStyles(order.status)}`}>
            {formatStatus(order.status)}
          </span>
          {(order as any).paymentStatus && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${getPaymentStatusStyles((order as any).paymentStatus)}`}>
              {(order as any).paymentStatus}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-white mb-2 truncate">
          {order.customerName || order.username || 'Anonymous User'}
        </h3>

        {/* Customer Contact Info */}
        {(order as any).customerEmail || (order as any).customerPhone ? (
          <div className="flex flex-wrap gap-2 mb-2">
            {(order as any).customerEmail && (
              <span className="text-xs text-gray-400">{(order as any).customerEmail}</span>
            )}
            {(order as any).customerPhone && (
              <span className="text-xs text-gray-400">{(order as any).customerPhone}</span>
            )}
          </div>
        ) : null}

        {/* Time Slot Info */}
        {(order as any).timeSlot || (order as any).pickupTime || (order as any).pickupDate ? (
          <div className="mb-2">
            <span className="text-xs text-gray-400">
              {(order as any).pickupDate && `${(order as any).pickupDate} `}
              {(order as any).timeSlot && `| ${(order as any).timeSlot}`}
              {(order as any).pickupTime && `| ${new Date((order as any).pickupTime).toLocaleTimeString()}`}
            </span>
          </div>
        ) : null}

        {/* Items List */}
        <div className="flex flex-wrap gap-2 mb-3">
          {order.items.map((item, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] text-gray-400">
              <span className="font-black text-white mr-1">{item.quantity}x</span> {item.name}
            </span>
          ))}
        </div>

        <div className="text-sm font-black text-white/90">
          Total: <span className="text-xl text-yellow-500">₹{order.total}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 self-end md:self-center">
        <div className="flex flex-col gap-2">
          {/* Confirm Button - available if pending */}
          <button
            onClick={() => onUpdateStatus(order.id, 'confirmed')}
            disabled={order.status !== 'pending'}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300
                        ${order.status === 'confirmed'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-not-allowed opacity-50'
                : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/40 active:scale-95 cursor-pointer disabled:grayscale disabled:opacity-30 disabled:cursor-not-allowed'}`}
          >
            Confirm
          </button>

          {/* Preparing Button - available if confirmed */}
          <button
            onClick={() => onUpdateStatus(order.id, 'preparing')}
            disabled={order.status !== 'confirmed'}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300
                        ${order.status === 'preparing'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 cursor-not-allowed opacity-50'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/40 active:scale-95 cursor-pointer disabled:grayscale disabled:opacity-30 disabled:cursor-not-allowed'}`}
          >
            Preparing
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {/* Ready Button - available if preparing */}
          <button
            onClick={() => onUpdateStatus(order.id, 'ready')}
            disabled={order.status !== 'preparing'}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300
                        ${order.status === 'ready'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed opacity-50'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/40 active:scale-95 cursor-pointer disabled:grayscale disabled:opacity-30 disabled:cursor-not-allowed'}`}
          >
            Ready
          </button>

          {/* Cancel Button - available if not completed */}
          <button
            onClick={() => onUpdateStatus(order.id, 'cancelled')}
            disabled={['cancelled', 'completed'].includes(order.status)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300
                        ${order.status === 'cancelled'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed opacity-50'
                : 'bg-white/5 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface LiveOrdersQueueProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onUpdateNote?: (orderId: string, note: string) => void;
  enableBulkActions?: boolean;
  onBulkAction?: (orderIds: string[], action: string) => void;
}

const LiveOrdersQueue: React.FC<LiveOrdersQueueProps> = ({ orders, onUpdateStatus, onUpdateNote, enableBulkActions, onBulkAction }) => {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'All'>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const filters: (OrderStatus | 'All')[] = [
    'All', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'
  ] as const;

  const filteredOrders = activeFilter === 'All'
    ? orders
    : orders.filter(order => order.status === activeFilter);

  const handleToggleSelect = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.size === 0) return;
    if (onBulkAction) {
      await onBulkAction(Array.from(selectedOrders), action);
      setSelectedOrders(new Set());
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Live Queue <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">{filteredOrders.length}</span>
        </h2>

        <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 cursor-pointer ${activeFilter === filter
                ? 'bg-white text-black shadow-lg shadow-white/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {enableBulkActions && selectedOrders.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedOrders.size === filteredOrders.length}
              onChange={handleSelectAll}
              className="w-5 h-5 rounded border-2 border-white/30 bg-white/10 checked:bg-blue-500 checked:border-blue-500 cursor-pointer"
            />
            <span className="text-white font-bold">{selectedOrders.size} orders selected</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('confirmed')}
              className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs transition-all"
            >
              Confirm All
            </button>
            <button
              onClick={() => handleBulkAction('preparing')}
              className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs transition-all"
            >
              Prepare All
            </button>
            <button
              onClick={() => handleBulkAction('ready')}
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-xs transition-all"
            >
              Ready All
            </button>
            <button
              onClick={() => handleBulkAction('cancelled')}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-all"
            >
              Cancel All
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4 pb-20">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onUpdateStatus={onUpdateStatus} 
                onOpenDetails={setSelectedOrder}
                enableBulkActions={enableBulkActions}
                isSelected={selectedOrders.has(order.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                <span className="text-4xl text-gray-600">🥘</span>
              </div>
              <h3 className="text-xl font-bold text-gray-500 mb-1">No Orders Found</h3>
              <p className="text-sm text-gray-600">No active {activeFilter !== 'All' ? activeFilter : ''} orders at the moment.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <OrderDetailsModal 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        onUpdateNote={onUpdateNote}
      />
    </div>
  );
};

export default LiveOrdersQueue;
