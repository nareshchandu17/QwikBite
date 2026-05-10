'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, QrCode, CheckCircle, ArrowLeft, Lock, Truck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentRedirectPage() {
  const [processing, setProcessing] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [redirectMessage, setRedirectMessage] = useState('Processing your payment...');
  const router = useRouter();

  useEffect(() => {
    console.log("Payment redirect page loaded");
    // Get payment method from localStorage
    const storedMethod = localStorage.getItem('selectedPaymentMethod');
    const orderData = localStorage.getItem('orderData');
    const paymentIntent = localStorage.getItem('paymentIntent');
    const orderId = localStorage.getItem('orderId');
    
    console.log("Stored payment method:", storedMethod);
    
    if (storedMethod) {
      setPaymentMethod(storedMethod);
      
      // Handle different payment methods
      if (storedMethod === 'cash') {
        // For Cash on Delivery, redirect immediately
        setRedirectMessage('Placing your order...');
        toast.success('Order placed successfully!');
        
        // Clear cart
        localStorage.removeItem('cart');
        
        setTimeout(() => {
          console.log("Redirecting to order status for cash payment");
          const redirectOrderId = orderId || 'latest';
          router.push(`/order-status/${redirectOrderId}`);
        }, 2000);
      } else {
        // For Online Payments, redirect to actual payment gateway
        setRedirectMessage('Redirecting to secure payment gateway...');
        
        // Get order data
        let orderInfo = null;
        if (orderData) {
          try {
            orderInfo = JSON.parse(orderData);
          } catch (e) {
            console.error('Error parsing order data:', e);
          }
        }
        
        // Generate UPI payment link using environment variable
        const upiId = process.env.NEXT_PUBLIC_UPI_ID || "qwikbite@paytm";
        const amount = orderInfo?.total || 0;
        const orderNote = `Order ${orderId || 'N/A'}`;
        const upiLink = `upi://pay?pa=${upiId}&pn=qwikBite&am=${amount}&tn=${encodeURIComponent(orderNote)}`;
        
        // Also generate links for specific apps
        const paytmLink = `paytm://upi/pay?pa=${upiId}&pn=qwikBite&am=${amount}&tn=${encodeURIComponent(orderNote)}`;
        const phonepeLink = `phonepe://pay?pa=${upiId}&pn=qwikBite&am=${amount}&tn=${encodeURIComponent(orderNote)}`;
        const gpayLink = `tez://upi/pay?pa=${upiId}&pn=qwikBite&am=${amount}&tn=${encodeURIComponent(orderNote)}`;
        
        // Store return URL for callback
        const returnUrl = `${window.location.origin}/order-status/${orderId || 'latest'}`;
        localStorage.setItem('paymentReturnUrl', returnUrl);
        
        setTimeout(() => {
          // Try to open the most appropriate payment app
          // First, try specific app links
          if (storedMethod === 'wallet') {
            // For digital wallet, try common wallet apps
            // Try Paytm first, then fallback to generic UPI
            const paytmWindow = window.open(paytmLink, '_blank');
            if (!paytmWindow) {
              // If Paytm app is not installed, fallback to generic UPI
              window.location.href = upiLink;
            }
          } else {
            // For card payments or default, use generic UPI link
            window.location.href = upiLink;
          }
        }, 1500);
      }
    } else {
      console.log("No stored payment method found, redirecting to payment page");
      // Default fallback
      setTimeout(() => {
        router.push('/payment');
      }, 2000);
    }
  }, [router]);

  // Payment method details for display
  const paymentMethodDetails = {
    card: { name: 'Credit/Debit Card', icon: <CreditCard className="w-6 h-6" /> },
    wallet: { name: 'Digital Wallet', icon: <Wallet className="w-6 h-6" /> },
    qr: { name: 'QR Code Payment', icon: <QrCode className="w-6 h-6" /> },
    cash: { name: 'Cash on Pickup', icon: <Wallet className="w-6 h-6" /> }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
              {paymentMethod && paymentMethodDetails[paymentMethod as keyof typeof paymentMethodDetails] ? (
                paymentMethodDetails[paymentMethod as keyof typeof paymentMethodDetails].icon
              ) : (
                <Lock className="w-6 h-6 text-amber-400" />
              )}
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            {paymentMethod === 'cash' ? 'Placing Order' : 'Processing Payment'}
          </h1>
          
          <p className="text-slate-300 mb-8">
            {redirectMessage}
          </p>
          
          {paymentMethod && paymentMethodDetails[paymentMethod as keyof typeof paymentMethodDetails] && (
            <div className="bg-slate-700/50 rounded-xl p-4 mb-8">
              <div className="flex items-center justify-center space-x-3">
                <div className="text-amber-400">
                  {paymentMethodDetails[paymentMethod as keyof typeof paymentMethodDetails].icon}
                </div>
                <span className="text-white font-medium">
                  {paymentMethodDetails[paymentMethod as keyof typeof paymentMethodDetails].name}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
          
          <p className="text-slate-400 text-sm mt-8">
            {paymentMethod === 'cash' 
              ? 'Your order will be confirmed and prepared for pickup' 
              : 'You will be redirected to your payment app'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}