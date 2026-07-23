import React, { useState } from 'react';
import { Order } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { menuItems } from '@/data/menu';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateNote?: (orderId: string, note: string) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, onUpdateNote }) => {
  const [note, setNote] = useState('');

  if (!order) return null;

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

  // Handle image URL construction
  const getImageUrl = (image?: string, itemName?: string) => {
    // First try to match from menu (this is the real image)
    if (itemName) {
      const menuImage = getMenuImageForItem(itemName);
      if (menuImage) {
        return menuImage;
      }
    }
    
    if (!image) return '/images/order.jpg';
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    if (image.startsWith('/')) {
      return image;
    }
    return `/${image}`;
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    
    try {
      if (onUpdateNote) {
        await onUpdateNote(order.id, note);
        toast.success('Note added successfully');
        setNote('');
      }
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">Order Details</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Order ID</span>
                  <p className="text-white font-bold">{order.id}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Status</span>
                  <p className="text-white font-bold capitalize">{order.status}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Customer</span>
                  <p className="text-white font-bold">{order.customerName || order.username || 'Guest'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Total</span>
                  <p className="text-white font-bold">₹{order.total}</p>
                </div>
              </div>

              {/* Contact Info */}
              {(order as any).customerEmail || (order as any).customerPhone ? (
                <div className="p-4 bg-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2">Contact Information</h3>
                  {(order as any).customerEmail && (
                    <p className="text-gray-300 text-sm mb-1">Email: {(order as any).customerEmail}</p>
                  )}
                  {(order as any).customerPhone && (
                    <p className="text-gray-300 text-sm">Phone: {(order as any).customerPhone}</p>
                  )}
                </div>
              ) : null}

              {/* Time Slot */}
              {(order as any).timeSlot || (order as any).pickupTime || (order as any).pickupDate ? (
                <div className="p-4 bg-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2">Pickup Information</h3>
                  <p className="text-gray-300 text-sm">
                    {(order as any).pickupDate && `Date: ${(order as any).pickupDate}`}
                    {(order as any).timeSlot && ` | Time: ${(order as any).timeSlot}`}
                    {(order as any).pickupTime && ` | ${new Date((order as any).pickupTime).toLocaleString()}`}
                  </p>
                </div>
              ) : null}

              {/* Items */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Items</h3>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-700 overflow-hidden">
                          <img
                            src={getImageUrl(item.image || item.imageUrl || (item.menuItem as any)?.image, item.name)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/order.jpg';
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-white font-bold">{item.name}</p>
                          <p className="text-gray-400 text-sm">₹{item.price} x {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-white font-bold">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              {order.payment || (order as any).paymentStatus ? (
                <div className="p-4 bg-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2">Payment Information</h3>
                  <p className="text-gray-300 text-sm">
                    Status: {(order as any).paymentStatus || order.payment?.status}
                  </p>
                  {order.payment?.transactionId && (
                    <p className="text-gray-300 text-sm">
                      Transaction ID: {order.payment.transactionId}
                    </p>
                  )}
                  {order.payment?.method && (
                    <p className="text-gray-300 text-sm">
                      Method: {order.payment.method}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Status History */}
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div>
                  <h3 className="text-sm font-bold text-white mb-3">Status History</h3>
                  <div className="space-y-2">
                    {order.statusHistory.map((history, idx) => (
                      <div key={idx} className="p-3 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-bold capitalize">{history.status}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(history.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {history.message && (
                          <p className="text-gray-400 text-sm mt-1">{history.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Add Note */}
              {onUpdateNote && (
                <div className="p-4 bg-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2">Add Note</h3>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note to this order..."
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    className="mt-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all"
                  >
                    Add Note
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderDetailsModal;
