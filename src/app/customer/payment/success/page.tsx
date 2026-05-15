"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Repeat, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useOrders, type Order, type OrderStatus } from "@/context/OrderContext";
import { toast } from "sonner";

// Dynamically import Confetti with no SSR to avoid window is not defined errors
const Confetti = dynamic(() => import('react-confetti'), {
  ssr: false,
});

type ClassValue = string | Record<string, boolean> | undefined | null | false;

function cn(...classes: ClassValue[]): string {
  return classes
    .map((cls) => {
      if (!cls) return '';
      if (typeof cls === 'string') return cls;
      return Object.entries(cls)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(' ');
    })
    .filter(Boolean)
    .join(' ');
}

const Button = ({ children, onClick, className = '' }: { children: React.ReactNode; onClick: () => void; className?: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "bg-primary text-white hover:bg-primary/90 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
      className
    )}
  >
    {children}
  </button>
);

const OrderConfirmationCard = ({
  orderId,
  paymentMethod,
  dateTime,
  totalAmount,
  onGoToAccount,
  onOrderAgain,
  heading = "Payment Successful!",
  title = "Thank you for your order. Your payment has been processed successfully",
  icon = <CheckCircle2 className="h-12 w-12 text-green-500" />,
  className,
}: {
  orderId: string;
  paymentMethod: string;
  dateTime: string;
  totalAmount: string;
  onGoToAccount: () => void;
  onOrderAgain: () => void;
  heading?: string;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}) => {
  interface DetailItem {
    label: string;
    value: string;
    isBold?: boolean;
  }

  const details: DetailItem[] = [
    { label: "Order ID", value: orderId, isBold: false },
    { label: "Payment Method", value: paymentMethod, isBold: false },
    { label: "Date & Time", value: dateTime, isBold: false },
    { label: "Total", value: totalAmount, isBold: true },
  ];

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeInOut",
        staggerChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        aria-live="polite"
        className={cn(
          "relative w-full max-w-sm rounded-xl border bg-white text-gray-900 shadow-lg p-6 sm:p-8 transition-all duration-300 hover:shadow-[0_0_25px_8px_rgba(251,191,36,0.6)]",
          className ?? " "
        )}
      >
        <div className="flex flex-col items-center space-y-4 text-center">
          <motion.div variants={itemVariants}>{icon}</motion.div>
          <motion.h1 variants={itemVariants} className="text-3xl font-bold text-gray-900">
            {heading}
          </motion.h1>
          <motion.h2 variants={itemVariants} className="text-gray-600 text-lg">
            {title}
          </motion.h2>

          <motion.div variants={itemVariants} className="w-full space-y-4 pt-4">
            {details.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center justify-between border-b pb-4 text-sm",

                  index === details.length - 1 ? "border-none pb-0" : ""

                )}
              >
                <span className={cn("font-semibold text-gray-800")}>{item.label}</span>
                <span className={cn({ "text-lg font-bold text-gray-900": item.isBold === true, "text-gray-600": item.isBold !== true })}>
                  {item.value}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="w-full pt-4 flex flex-row gap-4 justify-center">
            <Button
              onClick={onOrderAgain}
              className="flex-1 max-w-[200px] bg-amber-300 hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              Order Again
            </Button>
            <Button
              onClick={onGoToAccount}
              className="flex-1 max-w-[200px] bg-amber-300 hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              View Order Status
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

interface OrderData {
  items: Array<{
    id: string | number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  total: number;
  paymentMethod: string;
  timeSlot: string;
  username: string;
}

export default function PaymentSuccessPage() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [orderId, setOrderId] = useState<string>('');
  const orderIdRef = useRef<string>('');
  const { addOrder } = useOrders();
  const router = useRouter();
  const orderProcessedRef = useRef(false);
  const [paymentMethod, setPaymentMethod] = useState('Card');

  // Initialize orderId from localStorage on mount
  useEffect(() => {
    const savedOrderId = localStorage.getItem('lastOrderId') || localStorage.getItem('orderId');
    if (savedOrderId) {
      console.log('📦 Loaded order ID from localStorage:', savedOrderId);
      setOrderId(savedOrderId);
      orderIdRef.current = savedOrderId; // Also store in ref for immediate access
      console.log('📌 Set orderId state and ref to:', savedOrderId);
    } else {
      console.warn('⚠️ No order ID found in localStorage');
    }
  }, []);

  // First effect: Fetch most recent order from database
  useEffect(() => {
    const fetchRecentOrder = async () => {
      try {
        console.log('[Payment Success] 📦 Fetching most recent order from database...');
        
        // Fetch the most recent order from the database
        const response = await fetch('/api/orders/customer/recent', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Payment Success] ✅ Recent order fetched:', data);
          
          if (data.success && data.order) {
            const orderData = {
              items: data.order.items || [],
              total: data.order.total || 0,
              timeSlot: data.order.timeSlot || 'ASAP',
              paymentMethod: data.order.paymentMethod || 'online',
              username: data.order.username || 'Customer'
            };
            
            console.log('[Payment Success] ✅ Order data prepared:', orderData);
            setOrderData(orderData);
            setOrderId(data.order.id || data.order.orderId || `#${Math.floor(10000000 + Math.random() * 90000000)}`);
          } else {
            console.log('[Payment Success] ⚠️ No recent order found');
            // Set default empty order data
            setOrderData({
              items: [],
              total: 0,
              timeSlot: 'ASAP',
              paymentMethod: 'online',
              username: 'Customer'
            });
          }
        } else {
          console.log('[Payment Success] ❌ Failed to fetch recent order');
          const errorData = await response.json().catch(() => ({}));
          console.error('[Payment Success] API Error:', errorData);
        }
        
      } catch (error) {
        console.error('[Payment Success] ❌ Error fetching recent order:', error);
        // Set default empty order data
        setOrderData({
          items: [],
          total: 0,
          timeSlot: 'ASAP',
          paymentMethod: 'online',
          username: 'Customer'
        });
      }
      
      setShowConfetti(true);
    };

    fetchRecentOrder();
  }, []);

  // Define processOrder as a memoized callback
  const processOrder = useCallback(async () => {
    if (!orderData || orderProcessedRef.current) {
      console.log('[Payment Success] Skipping order processing:', {
        hasOrderData: !!orderData,
        alreadyProcessed: orderProcessedRef.current
      });
      return;
    }

    orderProcessedRef.current = true;

    // Get payment method with fallback - check multiple sources
    const currentPaymentMethod = paymentMethod || orderData.paymentMethod || 'Card';

    console.log('[Payment Success] Order validation passed, paymentMethod:', currentPaymentMethod);

    // Create the order in the format expected by OrderContext
    const newOrder = {
      username: 'You',
      status: 'Preparing' as const,
      items: orderData.items.map(item => `${item.quantity}x ${item.name}`).join(', '),
      price: `$${orderData.total.toFixed(2)}`,
      total: orderData.total,
      imageUrl: orderData.items[0]?.image || '/images/default-food.jpg',
      originalPrice: `$${orderData.total.toFixed(2)}`,
      itemsArray: orderData.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      timeSlot: orderData.timeSlot || 'ASAP',
      paymentMethod: currentPaymentMethod,
      statusText: 'Preparing your order',
      progressStep: 0
    };

    console.log('[Payment Success] Adding new order:', newOrder);
    // Get the generated order ID from addOrder
    const currentOrderId = await addOrder(newOrder);
    console.log('[Payment Success] Order created and saved with ID:', currentOrderId);
    setOrderId(currentOrderId);
    orderIdRef.current = currentOrderId; // Also set in ref for immediate access
    console.log('[Payment Success] Set orderId state and ref to:', currentOrderId);

    // Create transaction in database
    console.log('[Payment Success] Creating transaction...');

    // Prepare transaction data with proper types and validation
    const transactionData = {
      orderId: currentOrderId,
      customer: 'You',
      amount: parseFloat(orderData.total.toString()), // Ensure It&apos;s a number
      method: currentPaymentMethod.trim(), // Use the resolved payment method
      status: 'Success'
    };

    console.log('[Payment Success] Transaction data being sent to API:', {
      orderId: transactionData.orderId,
      customer: transactionData.customer,
      amount: transactionData.amount,
      method: transactionData.method,
      status: transactionData.status
    });

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(transactionData)
      });

      if (response.ok) {
        const txnData = await response.json();
        console.log('[Payment Success] Transaction created:', txnData);
        
        // Show success message
        toast.success('Payment successful! Transaction recorded.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Payment Success] Transaction creation failed:', errorData);
        toast.error('Payment successful but transaction recording failed.');
      }
    } catch (error: unknown) {
      console.error('[Payment Success] Error processing order:', error);
    }
  }, [orderData, orderProcessedRef, addOrder, router, paymentMethod]);

  // Effect: Process order ONLY if it hasn't been created yet
  useEffect(() => {
    const runProcessing = async () => {
      // If we already have an orderId that isn't a placeholder, it's already created
      const savedOrderId = localStorage.getItem('orderId') || localStorage.getItem('lastOrderId');
      if (savedOrderId && !savedOrderId.startsWith('#')) {
        console.log('[Payment Success] Order already exists in localStorage, skipping creation:', savedOrderId);
        orderProcessedRef.current = true;
        return;
      }

      if (orderData && orderData.items && orderData.items.length > 0 && !orderProcessedRef.current) {
        console.log('[Payment Success] No existing order found, creating new order...');
        await processOrder();
      } else if (orderData && (!orderData.items || orderData.items.length === 0)) {
        console.log('[Payment Success] Order data has no items, skipping creation');
        orderProcessedRef.current = true;
      }
    };

    runProcessing();
  }, [orderData, processOrder]);

  const handleGoToAccount = () => {
    console.log('🔘 View Order Status clicked');
    
    // Try ref first (most reliable), then state, then localStorage
    let finalOrderId = orderIdRef.current || orderId;
    console.log('📌 OrderId from ref:', orderIdRef.current, 'from state:', orderId);
    
    // If orderId is empty or placeholder, try localStorage
    if (!finalOrderId || finalOrderId === '' || finalOrderId.startsWith('#')) {
      console.log('⚠️ OrderId not set, checking localStorage...');
      const savedOrderId = localStorage.getItem('lastOrderId') || localStorage.getItem('orderId');
      console.log('💾 LocalStorage orderId:', savedOrderId);
      
      if (savedOrderId && !savedOrderId.startsWith('#')) {
        finalOrderId = savedOrderId;
        console.log('✅ Using localStorage orderId:', finalOrderId);
      }
    }
    
    // Final check - navigate to order status if we have a valid ID
    if (finalOrderId && !finalOrderId.startsWith('#') && finalOrderId !== '') {
      console.log('✅ Navigating to order status:', `/customer/order-status/${finalOrderId}`);
      router.push(`/customer/order-status/${finalOrderId}`);
      return;
    }
    
    // If we still Don&apos;t have a valid order ID, log error and redirect to account
    console.error('❌ No valid orderId found. Ref:', orderIdRef.current, 'State:', orderId, 'LocalStorage:', localStorage.getItem('lastOrderId'));
    console.warn('⚠️ Falling back to account page');
    router.push('/customer/account');
  };

  const handleOrderAgain = () => {
    router.push('/customer/menu');
  };

  React.useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Get current date and time
  const now = new Date();
  const dateTime = now.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Calculate total amount
  const totalAmount = orderData ? `$${orderData.total.toFixed(2)}` : '$0.00';

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gray-100 p-4 overflow-hidden">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} gravity={0.4} />}
      <OrderConfirmationCard
        orderId={orderId}
        paymentMethod={orderData?.paymentMethod || 'Card'}
        dateTime={dateTime}
        totalAmount={totalAmount}
        onGoToAccount={handleGoToAccount}
        onOrderAgain={handleOrderAgain}
      />
    </div>
  );
}
