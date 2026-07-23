"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Clock, CreditCard, Receipt, Download, Star, MessageSquare, Bell, CheckCircle } from "lucide-react";
import { Order } from "@/types/order";
import { toast } from 'sonner';
import { websocketClient } from '@/lib/websocket';
import { useCustomerGuard } from '@/lib/auth/roleGuard'; // Add this import

export default function OrderDetail({ params }: { params: Promise<{ orderId: string }> | { orderId: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ rating: 0, comment: "" });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string, timestamp: Date}[]>([]);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const isWebSocketInitialized = useRef(false);
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    // Unwrap params
    if (params instanceof Promise) {
      params.then(p => setOrderId(p.orderId));
    } else {
      setOrderId((params as any).orderId);
    }
  }, [params]);

  useEffect(() => {
    if (!orderId) return;
    
    let mounted = true;
    
    const updateProgress = (status: string) => {
      const steps = ["received", "preparing", "ready", "delivered", "collected"];
      const index = steps.indexOf(status.toLowerCase());
      if (index >= 0) {
        setProgress(((index + 1) / steps.length) * 100);
      }
    };
    
    // Initialize WebSocket connection
    const initWebSocket = () => {
      if (isWebSocketInitialized.current) return;
      isWebSocketInitialized.current = true;
      
      websocketClient.connect('/customer');
      
      websocketClient.on('connect', () => {
        console.log('Connected to WebSocket server');
        // Join the specific room for this order
        websocketClient.joinRoom(`order:${orderId}`);
        if (mounted) {
          toast.success('Real-time tracking active');
        }
      });
      
      websocketClient.on('order:update', (data: any) => {
        if (data.orderId === orderId && mounted) {
          console.log('Order update received:', data);
          
          // Update order status in state
          setOrder(prev => prev ? { ...prev, status: data.status } : null);
          
          // Add notification
          const newNotification = {
            id: Date.now().toString(),
            message: data.message || `Order status updated to ${data.status}`,
            timestamp: new Date()
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          
          // Play notification sound
          if (notificationSoundRef.current) {
            notificationSoundRef.current.play().catch(e => console.log("Sound play failed:", e));
          }
          
          // Show toast notification
          toast.success(newNotification.message, {
            duration: 5000,
            icon: <Bell className="w-4 h-4" />
          });
          
          // Update progress
          updateProgress(data.status);
        }
      });
      
      websocketClient.on('disconnect', () => {
        if (mounted) toast.info('Tracking disconnected');
      });
    };
    
    const fetchOrder = () => {
      fetch(`/api/admin/orders`, { credentials: 'include' }) // Fetching from admin to get details, or a public endpoint
        .then(r => r.json())
        .then(d => { 
          if (mounted) { 
            const foundOrder = d.data?.find((o: any) => o.id === orderId);
            if (foundOrder) {
                setOrder(foundOrder); 
                updateProgress(foundOrder.status);
            }
            setLoading(false);
          } 
        })
        .catch((error) => {
          console.error('Failed to fetch order:', error);
          if (mounted) setLoading(false);
        });
    };
    
    fetchOrder();
    initWebSocket();
    
    return () => { 
      mounted = false; 
    };
  }, [orderId]);


  const handleDownloadInvoice = () => {
    toast.success("💾 Invoice downloaded successfully.");
    // In a real implementation, this would generate and download a PDF
  };

  const handleFeedbackSubmit = () => {
    if (feedback.rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    toast.success("🌟 Thanks for your feedback!");
    setShowFeedbackForm(false);
    setFeedback({ rating: 0, comment: "" });
    
    // In a real implementation, this would save the feedback to the API
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
        <p className="mt-4 text-slate-400">Loading order details...</p>
      </div>
    </div>
  );
  
  if (!order) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Order Not Found</h2>
        <p className="mt-2 text-slate-400">The order you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <button 
          onClick={() => router.push('/orders')}
          className="mt-6 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
        >
          Back to Orders
        </button>
      </div>
    </div>
  );

  const isDelivered = order.status === "completed" || (order.status as string) === "delivered";
  const canGiveFeedback = isDelivered && !order.feedbackGiven;

  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Notification Sound (hidden) */}
      <audio ref={notificationSoundRef} src="/sounds/notification.mp3" preload="auto" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.push('/orders')}
          className="flex items-center text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Orders
        </button>
        
        <div className="flex space-x-3">
          <button 
            onClick={handleDownloadInvoice}
            className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            <Download className="w-4 h-4 mr-2" />
            Invoice
          </button>
        </div>
      </div>

      {/* Order Header */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 mb-8 border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Order {order.id}</h1>
            <p className="text-slate-400 mt-1">
              {order.createdAt ? (
                <>
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </>
              ) : 'Loading order date...'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-white">${order.total.toFixed(2)}</p>
              <p className="text-sm text-slate-400">
                {order.payment ? `${order.payment.method} - ${order.payment.status}` : 'Payment info not available'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Order Progress</span>
          <span className="text-sm font-medium text-amber-400">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <motion.div 
            className="bg-amber-500 h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          ></motion.div>
        </div>
      </div>

      {/* Real-time Notifications */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <div className="mb-8 space-y-3">
            {notifications.slice(0, 3).map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4 flex items-start"
              >
                <Bell className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-amber-100">{notification.message}</p>
                  <p className="text-xs text-amber-300 mt-1">
                    {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button 
                  onClick={() => dismissNotification(notification.id)}
                  className="text-amber-400 hover:text-amber-300 ml-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Order Timeline */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Order Status</h2>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
          <OrderTimeline status={order.status} />
          
          {order.etaMinutes && order.status !== "completed" && (order.status as string) !== "delivered" && (
            <div className="mt-6 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-center">
              <Clock className="w-5 h-5 text-amber-400 mr-2" />
              <span className="text-amber-300">
                Estimated delivery: {new Date(Date.now() + order.etaMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Order Items</h2>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
          <div className="space-y-4">
            {order.items.map((item) => (
              <motion.div 
                key={item.id} 
                className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center">
                  {item.image ? (
                    <motion.img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 rounded-lg object-cover mr-4"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center mr-4">
                      <span className="text-slate-400">{item.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-white">{item.name}</h3>
                    <p className="text-sm text-slate-400">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white">Qty: {item.quantity}</p>
                  <p className="font-medium text-white">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </motion.div>
            ))}
            
            <div className="pt-4 mt-4 border-t border-slate-700/50">
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-white">Total</span>
                <span className="text-amber-400">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Delivery Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="font-medium text-white mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-amber-400" />
              Delivery Address
            </h3>
            <p className="text-slate-300">Campus Canteen Pickup</p>
            <p className="text-slate-400 text-sm mt-1">Main Building, Ground Floor</p>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="font-medium text-white mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-amber-400" />
              Delivery Time
            </h3>
            <p className="text-slate-300">
              {order.etaMinutes 
                ? `${order.etaMinutes} minutes from order placement` 
                : "Estimated time will be updated shortly"}
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Person */}
      {order.deliveryPerson && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Delivery Person</h2>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center">
              {order.deliveryPerson.image ? (
                <img 
                  src={order.deliveryPerson.image} 
                  alt={order.deliveryPerson.name} 
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mr-4">
                  <span className="text-slate-400 text-2xl">{order.deliveryPerson.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h3 className="font-medium text-white">{order.deliveryPerson.name}</h3>
                {order.deliveryPerson.phone && (
                  <p className="text-slate-400">{order.deliveryPerson.phone}</p>
                )}
                <button className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm transition">
                  Call Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Section */}
      {canGiveFeedback && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">How was your order?</h2>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
            {!showFeedbackForm ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">We'd love to hear your feedback!</h3>
                <p className="text-slate-400 mb-6">Your feedback helps us improve our service.</p>
                <button 
                  onClick={() => setShowFeedbackForm(true)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition"
                >
                  Leave Feedback
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Rate your experience</h3>
                
                <div className="flex justify-center mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedback({...feedback, rating: star})}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 ${star <= feedback.rating ? 'text-amber-400 fill-current' : 'text-slate-600'}`}
                      />
                    </button>
                  ))}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="comment" className="block text-sm font-medium text-slate-300 mb-2">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    id="comment"
                    rows={4}
                    value={feedback.comment}
                    onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="What did you like or dislike about your order?"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowFeedbackForm(false)}
                    className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFeedbackSubmit}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reorder Button */}
      <div className="text-center">
        <button 
          onClick={() => {
            toast.success("✅ Order added! Choose your slot to confirm.");
            // In a real implementation, this would add items to cart and redirect
          }}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition"
        >
          Order Again
        </button>
      </div>
    </motion.main>
  );
}
