import React, { useState } from 'react';
import { Order, OrderStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const getStatusStyles = (status: OrderStatus) => {
  switch (status) {
    case 'received': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    case 'preparing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'ready': return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'out_for_delivery': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
    case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50';
    case 'delivered': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};

const formatStatus = (status: OrderStatus): string => {
  if (status === 'out_for_delivery') return 'Out for Delivery';
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
};

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus }) => {
  const firstItem = order.items[0];
  const itemThumbnail = firstItem?.image || '/placeholder-food.jpg';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6
            bg-white/[0.03] hover:bg-white/[0.06]
            backdrop-blur-md border border-white/10
            shadow-xl transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
        <img
          src={itemThumbnail}
          alt="Order"
          className="w-full h-full rounded-xl object-cover shadow-2xl transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <span className="text-xs font-black tracking-widest uppercase text-white/40">#{order.id.split('-').pop()}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border ${getStatusStyles(order.status)}`}>
            {formatStatus(order.status)}
          </span>
          {order.payment?.status === 'paid' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PAID
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-white mb-2 truncate">
          {order.customerName || order.username || 'Anonymous User'}
        </h3>

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
          {/* Received Button - available if pending/initial or to mark as received */}
          <button
            onClick={() => onUpdateStatus(order.id, 'received')}
            disabled={order.status === 'received'}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300
                        ${order.status === 'received'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-not-allowed opacity-50'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/40 active:scale-95 cursor-pointer'}`}
          >
            Received
          </button>

          {/* Preparing Button - available if received */}
          <button
            onClick={() => onUpdateStatus(order.id, 'preparing')}
            disabled={order.status !== 'received'}
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
            disabled={['cancelled', 'delivered', 'collected'].includes(order.status)}
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
}

const LiveOrdersQueue: React.FC<LiveOrdersQueueProps> = ({ orders, onUpdateStatus }) => {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'All'>('All');

  const filters: (OrderStatus | 'All')[] = [
    'All', 'received', 'preparing', 'ready', 'cancelled'
  ] as const;

  const filteredOrders = activeFilter === 'All'
    ? orders
    : orders.filter(order => order.status === activeFilter);

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

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4 pb-20">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
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
    </div>
  );
};

export default LiveOrdersQueue;
