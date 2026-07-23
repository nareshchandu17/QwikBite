'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePusher } from '@/context/PusherContext';
import { 
  Clock, 
  Timer, 
  Check, 
  X, 
  Receipt, 
  Utensils, 
  Star, 
  MessageCircle, 
  Shield, 
  ShoppingBag, 
  UserCheck, 
  ChefHat, 
  QrCode,
  Copy,
  CheckCircle
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  description?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'ordered' | 'preparing' | 'ready' | 'picked_up' | 'delivered';
  createdAt: string;
  estimatedTime?: number;
  slotTiming?: string;
  paymentMethod?: string;
  pickupLocation?: string;
  timeSlot?: string;
  pickupDate?: string;
  taxRate?: number; // Tax rate as decimal (e.g., 0.18 for 18%)
  subtotal?: number; // Subtotal for tax calculation
  paymentStatus?: string; // Payment status like 'Paid In Full', 'Pending', etc.
}

interface qwikBiteEliteTrackerProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

// Generate dynamic status steps based on order data
const generateStatusSteps = (order: Order) => {
  const baseSteps = [
    {
      key: 'ordered',
      label: 'Order Received',
      time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }) : '',
      description: order.paymentMethod ? `Payment confirmed via ${order.paymentMethod}` : 'Order placed successfully',
      icon: Check,
      color: 'green'
    },
    {
      key: 'preparing',
      label: 'Preparing Your Meal',
      time: '',
      description: 'Our chefs are preparing your order',
      icon: ChefHat,
      color: 'primary',
      avgTime: 'Avg. prep time: 10-15 mins',
      progress: order.status === 'preparing' ? 65 : 0
    },
    {
      key: 'ready',
      label: 'Ready for Pickup',
      time: '',
      description: 'Your order is ready for collection',
      icon: ShoppingBag,
      color: 'blue'
    },
    {
      key: 'picked_up',
      label: 'Picked Up',
      time: '',
      description: 'Order collected successfully',
      icon: UserCheck,
      color: 'purple'
    },
    {
      key: 'delivered',
      label: 'Delivered',
      time: '',
      description: 'Order completed',
      icon: Star,
      color: 'emerald'
    }
  ];

  return baseSteps;
};

const statusConfig = {
  ordered: {
    label: "Order Received",
    gradient: "from-gray-300/25 via-slate-200/15 to-transparent",
    chip: "bg-gray-500/15 text-gray-700",
    line: "bg-gray-400",
  },
  preparing: {
    label: "Preparing Order",
    gradient: "from-amber-300/25 via-orange-200/15 to-transparent",
    chip: "bg-amber-500/15 text-amber-700",
    line: "bg-amber-400",
  },
  ready: {
    label: "Ready for Pickup",
    gradient: "from-blue-300/25 via-indigo-200/15 to-transparent",
    chip: "bg-blue-500/15 text-blue-700",
    line: "bg-blue-400",
  },
  picked_up: {
    label: "Picked Up",
    gradient: "from-purple-300/25 via-violet-200/15 to-transparent",
    chip: "bg-purple-500/15 text-purple-700",
    line: "bg-purple-400",
  },
  delivered: {
    label: "Delivered",
    gradient: "from-emerald-300/25 via-green-200/15 to-transparent",
    chip: "bg-emerald-500/15 text-emerald-700",
    line: "bg-emerald-400",
  },
};

export default function QwikBiteEliteTracker({ order, isOpen, onClose }: qwikBiteEliteTrackerProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [liveOrder, setLiveOrder] = useState(order);
  const [estimatedTime, setEstimatedTime] = useState(order.estimatedTime || null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const { pusherClient } = usePusher();

  // Generate dynamic status steps based on current order
  const statusSteps = generateStatusSteps(liveOrder);

  console.log('qwikBiteEliteTracker rendered:', { isOpen, order: order?.id });

  // Update local state when order prop changes
  useEffect(() => {
    setLiveOrder(order);
    setEstimatedTime(order.estimatedTime || null);
    const currentSteps = generateStatusSteps(order);
    const stepIndex = currentSteps.findIndex((step: any) => step.key === order.status);
    setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
  }, [order]);

  // Real-time pusher listeners
  useEffect(() => {
    if (!pusherClient || !isOpen || !liveOrder?.id) return;

    console.log('[EliteTracker] Setting up real-time listeners for order:', liveOrder.id);

    // Join order-specific channel
    const channelName = `order-${liveOrder.id.replace(/:/g, '-')}`;
    const channel = pusherClient.subscribe(channelName);

    // Listen for order status updates
    const handleOrderUpdate = (updatedOrder: any) => {
      console.log('[EliteTracker] Received order update:', updatedOrder);
      
      if (updatedOrder.id === liveOrder.id || updatedOrder._id === liveOrder.id) {
        console.log('[EliteTracker] Updating live order state');
        setLiveOrder(prev => ({ ...prev, ...updatedOrder }));
        
        // Update step based on new status
        const currentSteps = generateStatusSteps({ ...liveOrder, ...updatedOrder });
        const stepIndex = currentSteps.findIndex((step: any) => step.key === updatedOrder.status);
        if (stepIndex >= 0) {
          setCurrentStep(stepIndex);
        }

        // Update estimated time if provided
        if (updatedOrder.estimatedTime !== undefined) {
          setEstimatedTime(updatedOrder.estimatedTime);
        }

        // Show notification for status changes
        if (updatedOrder.status !== liveOrder.status) {
          const newStatus = statusConfig[updatedOrder.status as keyof typeof statusConfig] || statusConfig.preparing;
          console.log(`[EliteTracker] Order status changed to: ${newStatus.label}`);
        }
      }
    };

    // Listen for queue position updates
    const handleQueueUpdate = (data: any) => {
      console.log('[EliteTracker] Received queue update:', data);
      if (data.orderId === liveOrder.id && data.position !== undefined) {
        setQueuePosition(data.position);
      }
    };

    // Listen for estimated time updates
    const handleTimeUpdate = (data: any) => {
      console.log('[EliteTracker] Received time update:', data);
      if (data.orderId === liveOrder.id && data.estimatedTime !== undefined) {
        setEstimatedTime(data.estimatedTime);
      }
    };

    // Set up event listeners
    channel.bind('order:update', handleOrderUpdate);
    channel.bind('order:queue', handleQueueUpdate);
    channel.bind('order:time', handleTimeUpdate);

    // Clean up on unmount or close
    return () => {
      console.log('[EliteTracker] Cleaning up pusher listeners');
      channel.unbind('order:update', handleOrderUpdate);
      channel.unbind('order:queue', handleQueueUpdate);
      channel.unbind('order:time', handleTimeUpdate);
      pusherClient.unsubscribe(channelName);
    };
  }, [pusherClient, isOpen, liveOrder?.id, liveOrder.status]);

  // Removed API fetch call - using the order data passed from parent component

  const status = statusConfig[liveOrder.status] || statusConfig.preparing;
  const txnId = `CB-${liveOrder.id.slice(-8).toUpperCase()}`;

  const copyTxn = () => {
    navigator.clipboard.writeText(txnId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      y: 20
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="relative inset-0 flex items-center justify-center p-8 pt-16">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full h-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-premium bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background Gradient with Ambient Spotlight */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,153,64,0.25),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(255,213,128,0.35),transparent_55%),linear-gradient(to_bottom,rgba(255,255,255,0.6),rgba(255,255,255,0.2)),radial-gradient(circle_at_30%_10%,rgba(255,170,70,0.12),transparent_60%)]" />
              
              {/* Modal Content */}
              <div className="relative z-10 overflow-y-auto max-h-[90vh]">
                {/* Premium Header */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="sticky top-0 z-20"
                >
                  {/* Gradient + Glass Layer with Micro Grain */}
                  <div
                    className={`relative bg-gradient-to-b ${status.gradient} backdrop-blur-xl border-b border-white/40`}
                    style={{
                      backgroundImage: `
                        linear-gradient(to bottom right, rgba(246, 211, 155, 0.3), rgba(233, 192, 139, 0.2)),
                        url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")
                      `,
                      backgroundBlendMode: 'overlay'      
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        {/* Left */}
                        <div className="flex items-center gap-4">
                          <div className="bg-white/90 p-3 rounded-xl shadow-lg">
                            <Utensils className="w-6 h-6 text-orange-500" />
                          </div>

                          <div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                              Order Status
                            </h2>

                            {/* Transaction ID */}
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-mono">{txnId}</span>
                              <button
                                onClick={copyTxn}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/70 hover:bg-white transition shadow-sm"
                              >
                                {copied ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right - Status Chip */}
                        <div className="flex items-center gap-4">
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ 
                              scale: 1, 
                              opacity: 1,
                              boxShadow: [
                                "0 0 0 0 rgba(245,158,11,0.4)",
                                "0 0 0 8px rgba(245,158,11,0)",
                                "0 0 0 0 rgba(245,158,11,0.4)"
                              ]
                            }}
                            transition={{ 
                              delay: 0.15,
                              boxShadow: {
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 2
                              }
                            }}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status.chip}`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                            {status.label}
                          </motion.div>
                          
                          {/* Close Button */}
                          <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md group"
                          >
                            <X className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Animated Progress Accent with Shimmer */}
                    <div className={`h-[3px] origin-left ${status.line} relative overflow-hidden`}>
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
                        className="h-full bg-current"
                      />
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity, 
                          repeatDelay: 3,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      />
                    </div>
                    
                    {/* Bottom Glow Divider */}
                    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
                  </div>
                </motion.div>

                {/* Main Content */}
                <div className="p-0">
                  <div className="flex justify-center">
                    {/* Order Status Card - Centered */}
                    <div className="w-full max-w-3xl">
                      <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-8 shadow-premium relative overflow-hidden border border-gray-200" 
                           style={{
                             boxShadow: `
                               inset 0 1px 0 rgba(255,255,255,0.6),
                               0 20px 40px rgba(0,0,0,0.08)
                             `
                           }}>
                        <div className="relative z-10">
                          {/* Status Header */}
                          <div className="flex items-start justify-between mb-10">
                            <div>
                              <h3 className="text-2xl font-extrabold mb-1 text-gray-900">
                                {liveOrder.status === 'preparing' ? 'Almost ready!' : 
                                 liveOrder.status === 'ready' ? 'Ready for pickup!' :
                                 liveOrder.status === 'picked_up' ? 'Picked up!' :
                                 liveOrder.status === 'delivered' ? 'Delivered!' : 'Order received!'}
                              </h3>
                              <p className="text-gray-700 text-lg">
                                {liveOrder.timeSlot || liveOrder.slotTiming ? (
                                  <>Estimated pickup: <span className="font-bold text-gray-900">{liveOrder.timeSlot || liveOrder.slotTiming}</span></>
                                ) : estimatedTime ? (
                                  <>Estimated pickup: <span className="font-bold text-gray-900">
                                    {new Date(Date.now() + estimatedTime * 60000).toLocaleTimeString('en-US', { 
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true 
                                    })}
                                  </span></>
                                ) : (
                                  <>Estimated pickup: <span className="font-bold text-gray-900">Not specified</span></>
                                )}
                              </p>
                              {queuePosition !== null && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Queue position: <span className="font-bold text-amber-600">#{queuePosition + 1}</span>
                                </p>
                              )}
                            </div>
                            <div className="bg-[#ee9d2b]/10 p-4 rounded-2xl border border-[#ee9d2b]/20 shadow-inner">
                              <span className="material-symbols-outlined text-[#ee9d2b] text-[40px]">qr_code_2</span>
                            </div>
                          </div>

                          {/* Status Steps */}
                          <div className="relative space-y-0">
                            {statusSteps.map((step: any, index: number) => {
                              const isActive = index === currentStep;
                              const isCompleted = index < currentStep;
                              const Icon = step.icon;
                              
                              return (
                                <div
                                  key={step.key}
                                  className="grid grid-cols-[48px_1fr] gap-x-6"
                                >
                                  <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shadow-lg ${
                                      isCompleted 
                                        ? 'bg-green-500 text-white shadow-green-500/20' 
                                        : isActive 
                                          ? 'w-12 h-12 bg-[#ee9d2b] text-white active-step-glow ring-4 ring-[#ee9d2b]/10'
                                          : 'bg-gray-50 text-gray-300 border border-gray-100'
                                    }`}
                                    >
                                      <Icon className="w-5 h-5" />
                                    </div>
                                    <div className={`w-0.5 h-16 ${isCompleted ? 'bg-green-500/40' : 'bg-gray-100'} relative overflow-hidden`}>
                                      {isActive && (
                                        <div 
                                          className="absolute top-0 left-0 w-full bg-[#ee9d2b]/40"
                                          style={{ height: `${step.progress}%` }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <div className={`pt-1 pb-10 ${isCompleted ? 'text-green-700' : isActive ? 'text-[#ee9d2b]' : 'text-gray-600'}`}>
                                    <h4 className={`font-bold text-lg flex items-center gap-2 ${isActive ? 'font-extrabold text-xl text-gray-900' : 'text-gray-800'}`}>
                                      {step.label}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {step.time && `${step.time} • ${step.description}`}
                                    </p>
                                    {isActive && step.avgTime && (
                                      <p className="text-xs text-[#ee9d2b]/70 mt-2 font-semibold italic flex items-center gap-1">
                                        <Timer className="w-3 h-3" />
                                        {step.avgTime}
                                      </p>
                                    )}
                                    {isActive && step.progress && (
                                      <div className="mt-6 w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                                      <div 
                                        className="bg-[#ee9d2b] h-full rounded-full animated-progress shadow-[0_0_10px_rgba(238,157,43,0.5)]"
                                        style={{ width: `${step.progress}%` }}
                                      />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Pickup Info */}
                          <div 
                            className="mt-12 p-5 rounded-2xl bg-gray-50 border border-[#ee9d2b]/20 flex items-start gap-4 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[#ee9d2b] bg-[#ee9d2b]/10 p-1.5 rounded-lg">location_on</span>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                Please have your QR code ready for scanning.
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs font-bold text-[#ee9d2b] shadow-sm border border-[#ee9d2b]/10">
                                  📍 {liveOrder.pickupLocation || ''} • {liveOrder.estimatedTime ? `${Math.ceil(liveOrder.estimatedTime / 60)} min walk` : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

}
