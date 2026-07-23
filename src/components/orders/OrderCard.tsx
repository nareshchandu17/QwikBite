"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OrderStatusBadge from "./OrderStatusBadge";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { toast } from 'sonner';
import { Truck, FileText, RotateCcw } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  qty?: number;
}

// Import the Order type and OrderStatus from types/order
import { Order, OrderStatus } from "@/types/order";

type Props = { 
  order: Order;
};

export default function OrderCard({ order }: Props) {
  const [openTrack, setOpenTrack] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const handleReorder = () => {
    // Add items to cart
    order.items.forEach((it: OrderItem) => addItem({ 
      id: it.id, 
      name: it.name, 
      price: it.price,
      quantity: it.quantity || it.qty || 1
    }));
    
    toast.success("✅ Order added! Choose your slot to confirm.");
    router.push("/time-slots");
  };

  const handleTrack = () => {
    router.push(`/orders/${order.id}`);
  };

  const handleDownloadInvoice = () => {
    toast.success("💾 Invoice downloaded successfully.");
    // In a real implementation, this would generate and download a PDF
  };

  const showMore = order.items.length > 2;

  const statusColors: Record<string, string> = {
    received: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    preparing: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    almost_ready: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    ready: 'bg-green-500/10 text-green-500 border-green-500/20',
    collected: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    pending: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    confirmed: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    out_for_delivery: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    delayed: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
  };

  // Format date - handles both string and Date types
  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status display text
  const getStatusText = (status: OrderStatus) => {
    const statusMap: Record<string, string> = {
      'received': 'Order Placed',
      'preparing': 'Preparing',
      'ready': 'Ready for Pickup',
      'collected': 'Collected',
      'delivered': 'Delivered',
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'out_for_delivery': 'On the Way',
      'cancelled': 'Cancelled',
      'delayed': 'Delayed',
      'almost_ready': 'Almost Ready'
    };
    return statusMap[status] || status;
  };

  // Get status icon
  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<string, React.ReactNode> = {
      received: <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>,
      preparing: <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>,
      almost_ready: <div className="w-2 h-2 rounded-full bg-purple-400 mr-2"></div>,
      ready: <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>,
      collected: <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>,
      delivered: <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>,
      pending: <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>,
      confirmed: <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></div>,
      out_for_delivery: <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>,
      cancelled: <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>,
      delayed: <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
    };
    return icons[status] || <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Order Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h3>
          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <div className="flex -space-x-2 mb-3">
          {order.items.slice(0, 4).map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-sm">
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder-food.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <span className="text-xs">{item.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              {idx === 3 && order.items.length > 4 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs font-medium">
                  +{order.items.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-2">
          {order.items.slice(0, 2).map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.quantity} × {item.name}</span>
              <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {showMore && (
            <div className="text-xs text-amber-500">+{order.items.length - 2} more items</div>
          )}
        </div>
      </div>

      {/* Order Timeline */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
          <span className="text-amber-600 font-medium">Order Progress</span>
          <span>Step {['pending', 'preparing', 'out_for_delivery', 'delivered'].indexOf(order.status) + 1} of 4</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
          <div 
            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${['pending', 'preparing', 'ready', 'collected'].indexOf(order.status) * 33.33 + 25}%`
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">

          <span className={`${order.status === 'pending' ? 'text-amber-600 font-medium' : ''}`}>Placed</span>
          <span className={`${order.status === 'preparing' ? 'text-amber-600 font-medium' : ''}`}>Preparing</span>
          <span className={`${order.status === 'ready' ? 'text-amber-600 font-medium' : ''}`}>Ready</span>
          <span className={`${order.status === 'completed' || (order.status as string) === 'collected' ? 'text-amber-600 font-medium' : ''}`}>Picked Up</span>
        </div>
      </div>

      {/* Order Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</div>
        <div className="flex space-x-2">
          <button
            onClick={handleTrack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all hover:shadow-sm"
          >
            <Truck className="w-4 h-4 mr-2 text-amber-600" />
            Track
          </button>
          <button
            onClick={handleReorder}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all hover:shadow-md"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reorder
          </button>
          <button
            onClick={handleDownloadInvoice}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all hover:shadow-sm"
            title="Download Invoice"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>
        
      

      {/* Track & Invoice modals (animated) */}
      <AnimatePresence>
        {openTrack && (
          <motion.div
            key="track"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50"
          >
            <motion.div className="w-full md:w-3/5 bg-gradient-to-br from-slate-900/90 to-black/90 rounded-t-2xl md:rounded-2xl p-6"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tracking {order.id}</h3>
                <button onClick={() => setOpenTrack(false)} className="text-slate-400 hover:text-white">Close</button>
              </div>
              <div className="mt-4 text-sm text-slate-300">
                <div>ETA: {order.etaMinutes ? `${order.etaMinutes} mins` : "—"}</div>
                <div className="mt-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">1</div>
                    <div>Order placed</div>
                  </div>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">2</div>
                    <div>Preparing</div>
                  </div>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">3</div>
                    <div>Out for Delivery</div>
                  </div>
                </div>
                {order.deliveryPerson && (
                  <div className="mt-4 p-3 bg-slate-800 rounded-lg flex items-center space-x-3">
                    <img src={order.deliveryPerson.image} className="w-10 h-10 rounded-full" alt={order.deliveryPerson.name} />
                    <div>
                      <div className="text-sm font-medium">{order.deliveryPerson.name}</div>
                      <div className="text-xs text-slate-400">{order.deliveryPerson.phone}</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {openInvoice && (
          <motion.div key="invoice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <motion.div className="w-full md:w-2/5 bg-gradient-to-br from-slate-900/95 to-black/95 rounded-2xl p-6"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Invoice {order.id}</h3>
                <button onClick={() => setOpenInvoice(false)} className="text-slate-400 hover:text-white">Close</button>
              </div>
              <div className="mt-4 text-sm text-slate-300">
                <div className="flex justify-between"><div>Subtotal</div><div>${order.total.toFixed(2)}</div></div>
                <div className="flex justify-between mt-2"><div>Tax</div><div>$0.00</div></div>
                <div className="flex justify-between mt-2"><div>Delivery Fee</div><div>$0.00</div></div>
                <div className="flex justify-between mt-3 font-semibold text-white"><div>Total</div><div>${order.total.toFixed(2)}</div></div>
                <div className="mt-4 flex items-center space-x-3">
                  <button 
                    onClick={handleDownloadInvoice}
                    className="px-4 py-2 bg-amber-400 rounded-lg font-medium hover:bg-amber-300 transition"
                  >
                    Download
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition"
                  >
                    Print
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}