"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useOrders } from "@/context/OrderContext";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function ProcessingPaymentPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing payment...");
  const { addOrder } = useOrders();
  const { items, timeSlot } = useCartStore();
  const { token, user, isAuthenticated, loading } = useAuth();

  // 1. ALL HOOKS DEFINED FIRST
  
  // Memoize total to avoid re-calculating on every render
  const total = useMemo(() => 
    items.reduce((total: number, item: any) => total + (item.item.price || 0) * item.quantity, 0),
    [items]
  );

  // Handle auth redirect
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('[Payment Processing] User not authenticated - redirecting to signin');
      toast.error("Session expired. Please login again.");
      router.replace("/signin");
    }
  }, [loading, isAuthenticated, router]);

  // Handle empty cart redirect
  useEffect(() => {
    if (!loading && isAuthenticated && (!items || items.length === 0)) {
      console.log('[Payment Processing] Cart is empty, redirecting to menu...');
      toast.error("Your cart is empty. Please add items before checkout.");
      router.replace("/customer/menu");
    }
  }, [loading, isAuthenticated, items, router]);

  const orderAttemptedRef = useRef(false);
  
  // Main payment processing logic
  useEffect(() => {
    // We only proceed if auth is ready and items exist and we haven't attempted yet
    if (loading || !isAuthenticated || !items || items.length === 0 || orderAttemptedRef.current) return;

    orderAttemptedRef.current = true;

    const updateTimeslotFill = async (selectedTimeSlot: string) => {
      try {
        if (!selectedTimeSlot || selectedTimeSlot === 'ASAP') return;
        console.log('[Payment Processing] Updating timeslot fill for:', selectedTimeSlot);
      } catch (error) {
        console.error('[Payment Processing] Error in timeslot processing:', error);
      }
    };
    
    const createOrderInDatabase = async () => {
      try {
        const uniqueId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const firstItemImage = items.length > 0 ? (String(items[0].item.image || '/images/order.jpg')) : '/images/order.jpg';
        
        const orderData = {
          orderId: uniqueId,
          username: user?.name || user?.email || 'Customer',
          price: `₹${total.toFixed(2)}`,
          total: total,
          items: items.map(item => `${item.quantity}x ${item.item.name || 'Item'}`).join(', '),
          status: 'Preparing' as const,
          imageUrl: firstItemImage,
          itemsArray: items.map(item => ({
            id: item.item.id,
            name: item.item.name,
            quantity: item.quantity,
            price: item.item.price,
            image: item.item.image
          })),
          timeSlot: timeSlot || 'ASAP',
          paymentMethod: localStorage.getItem('selectedPaymentMethod') || 'online'
        };

        const orderId = await addOrder(orderData, token || undefined);
        console.log('[Payment Processing] Order created successfully:', orderId);
        
        // Store in localStorage so PaymentSuccessPage knows it's already done
        localStorage.setItem('orderId', orderId);
        localStorage.setItem('lastOrderId', orderId);
        
        await updateTimeslotFill(timeSlot || '');
        return true;
      } catch (error) {
        console.error('[Payment Processing] Failed to create order:', error);
        toast.error('Failed to create order. Please try again.');
        return false;
      }
    };

    // Start database creation immediately in the background
    let dbCreationPromise = createOrderInDatabase();
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          
          // Wait for DB creation to finish if it hasn't already
          dbCreationPromise.then((success) => {
            if (success) {
              router.push("/customer/payment/success");
            } else {
              router.push("/customer/payment");
            }
          });
          return 100;
        }
        // Snappier progress
        const remaining = 100 - prev;
        const jump = Math.max(5, Math.random() * remaining * 0.4);
        return Math.min(prev + jump, 100);
      });
    }, 400);

    const statusInterval = setInterval(() => {
      setStatusText((prev) => {
        const statuses = [
          "Initializing payment...",
          "Connecting to bank server...",
          "Verifying card details...",
          "Authenticating transaction...",
          "Processing payment...",
          "Creating your order...",
          "Finalizing transaction..."
        ];
        const currentIndex = statuses.indexOf(prev);
        return statuses[Math.min(currentIndex + 1, statuses.length - 1)];
      });
    }, 1200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, [loading, isAuthenticated, items, total, user, token, timeSlot, addOrder, router]);

  // 2. CONDITIONAL RETURNS AFTER ALL HOOKS
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#f96124] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9e6047]">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Handled by useEffect redirect
  }

  if (!items || items.length === 0) {
    return null; // Handled by useEffect redirect
  }

  return (
    <div className="min-h-screen bg-[#f8f6f5] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract background elements */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#f96124] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#f96124]/40 rounded-full blur-[150px]"></div>
      </div>

      {/* Central Modal */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden border border-[#e9d5ce]">
        <div className="p-8 flex flex-col items-center text-center">
          {/* Premium Circular Loader */}
          <div className="relative flex items-center justify-center mb-10">
            <div className="w-24 h-24 rounded-full border-4 border-[#e9d5ce]"></div>
            <motion.div 
              className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-[#f96124] border-r-[#f96124]"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-inner">
              <span className="material-symbols-outlined text-[#f96124] text-3xl">payments</span>
            </div>
          </div>

          {/* Headline Text */}
          <h2 className="text-[#1c110d] tracking-tight text-2xl font-bold leading-tight mb-3">
            Processing your payment...
          </h2>

          {/* Body Text */}
          <p className="text-[#6e5045] text-base font-normal leading-relaxed mb-8 px-4">
            Please do not refresh or close this window. We are securing your transaction with the bank.
          </p>

          {/* Progress Bar */}
          <div className="w-full flex flex-col gap-2 mb-8 bg-[#fcf9f8] p-4 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9e6047]">Securing transaction</span>
              <span className="text-xs font-bold text-[#f96124]">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-[#e9d5ce] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#f96124] rounded-full shadow-[0_0_8px_rgba(249,97,36,0.4)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[11px] text-[#9e6047] mt-1 text-left flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">shield_lock</span>
              {statusText}
            </p>
          </div>

          {/* Footer Security Section */}
          <div className="w-full pt-6 border-t border-[#e9d5ce] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-[#e9d5ce] text-[#f96124] p-1.5 rounded-lg">
                <span className="material-symbols-outlined text-lg leading-none">verified_user</span>
              </div>
              <span className="text-xs font-bold text-[#1c110d] uppercase tracking-widest">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex w-2 h-2 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500"></span>
              </div>
              <span className="text-[11px] font-medium text-[#9e6047]">Live Connection</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Info List */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8 opacity-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">lock</span>
          <span className="text-xs">End-to-end Encrypted</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">credit_card</span>
          <span className="text-xs">PCI DSS Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">verified</span>
          <span className="text-xs">Certified Partner</span>
        </div>
      </div>
    </div>
  );
}
