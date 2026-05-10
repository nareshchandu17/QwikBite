'use client';

import { motion, AnimatePresence, easeInOut } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface OrderConfirmationCardProps {
  orderId: string;
  paymentMethod: string;
  dateTime: string;
  totalAmount: string;
  onGoToAccount: () => void;
  title?: string;
  buttonText?: string;
  icon?: React.ReactNode;
  className?: string;
}

const OrderConfirmationCard = ({
  orderId,
  paymentMethod,
  dateTime,
  totalAmount,
  onGoToAccount,
  title = "Your order has been successfully submitted",
  buttonText = "Check order status",
  icon = <CheckCircle2 className="h-12 w-12 text-green-500" />,
  className,
}: OrderConfirmationCardProps) => {
  const details = [
    { label: "Order ID", value: orderId },
    { label: "Payment Method", value: paymentMethod },
    { label: "Date & Time", value: dateTime },
    { label: "Total", value: totalAmount, isBold: true },
  ];

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: easeInOut,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 100,
        damping: 10
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
        className={`relative w-full max-w-sm rounded-xl border bg-white text-gray-900 shadow-lg p-6 sm:p-8 transition-all duration-300 hover:shadow-[0_0_25px_8px_rgba(251,191,36,0.6)] ${className || ''}`}
      >
        <div className="flex flex-col items-center space-y-6 text-center">
          <motion.div variants={itemVariants}>{icon}</motion.div>
          <motion.h2 
            variants={itemVariants} 
            className="text-2xl font-semibold"
          >
            {title}
          </motion.h2>

          <motion.div variants={itemVariants} className="w-full space-y-4 pt-4">
            {details.map((item, index) => (
              <div
                key={item.label}
                className={`flex items-center justify-between border-b pb-4 text-sm text-gray-500 ${
                  index === details.length - 1 ? 'border-none pb-0' : ''
                } ${item.isBold ? 'font-bold text-gray-900' : ''}`}
              >
                <span>{item.label}</span>
                <span className={item.isBold ? 'text-lg' : ''}>
                  {item.value}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="w-full pt-4">
            <button
              onClick={onGoToAccount}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer"
            >
              {buttonText}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function OrderConfirmation() {
  const [showConfetti, setShowConfetti] = useState(true);
  const router = useRouter();
  const [orderData, setOrderData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get order data from localStorage or API
    const storedOrder = localStorage.getItem('orderData');
    const orderId = localStorage.getItem('orderId');
    
    if (storedOrder) {
      try {
        const order = JSON.parse(storedOrder);
        setOrderData({
          ...order,
          id: orderId || 'N/A'
        });
      } catch (error) {
        console.error('Error parsing order data:', error);
      }
    }
    setIsLoading(false);

    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoToAccount = () => {
    router.push('/customer/orders');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Format date and time
  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gray-100 p-4 overflow-hidden">
      {showConfetti && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, delay: 3 }}
          className="fixed inset-0"
        >
          <div className="absolute inset-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="absolute inset-0">
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                    times: [0, 0.2, 0.5, 0.8, 1],
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-50 opacity-50" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
      <OrderConfirmationCard
        orderId={orderData?.id || 'N/A'}
        paymentMethod={orderData?.paymentMethod || 'Credit Card'}
        dateTime={orderData?.createdAt ? formatDateTime(orderData.createdAt) : new Date().toLocaleString()}
        totalAmount={`$${orderData?.total?.toFixed(2) || '0.00'}`}
        onGoToAccount={handleGoToAccount}
      />
    </div>
  );
}
