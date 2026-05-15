"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cartStore';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const StripePaymentForm = ({ clientSecret }: { clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  // Load order data from localStorage on component mount
  useEffect(() => {
    const storedOrderData = localStorage.getItem('orderData');
    if (storedOrderData) {
      try {
        const parsedData = JSON.parse(storedOrderData);
        setOrderData(parsedData);
      } catch (error) {
        console.error('Error parsing order data:', error);
        toast.error("Failed to load order data. Please try again.");
        router.push('/payment');
      }
    } else {
      // If no order data, redirect back to payment
      router.push('/payment');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      toast.error("Payment system is still loading. Please wait a moment.");
      return;
    }
    
    if (!clientSecret) {
      toast.error("Payment is not ready. Please wait.");
      return;
    }

    if (!orderData) {
      toast.error("Order data not found. Please try again.");
      return;
    }

    // Get the CardElement
    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      toast.error("Payment form is not ready. Please wait.");
      return;
    }

    setLoading(true);
    
    try {
      // Confirm the card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (result.error) {
        // Handle specific error messages
        if (result.error.message?.includes('expiration') || result.error.message?.includes('expiry')) {
          toast.error("Please check your card's expiration date. Use a future date (e.g., 12/30).");
        } else if (result.error.message?.includes('incomplete')) {
          toast.error("Please complete all card information fields.");
        } else {
          toast.error(result.error.message || "Payment failed. Please try again.");
        }
        console.error("Payment error:", result.error);
      } else {
        // Payment successful
        if (result.paymentIntent.status === "succeeded") {
          toast.success("Payment successful!");
          
          // Create order in our system
          const paymentData = {
            ...orderData,
            payment: 'card',
            paymentIntentId: result.paymentIntent.id
          };
          
          try {
            console.log('💾 Creating order in database...');
            const orderResponse = await fetch('/api/orders/customer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(paymentData),
              credentials: 'include'
            });
            
            const orderResult = await orderResponse.json();
            console.log('📋 Order creation response:', orderResult);
            
            if (orderResponse.ok) {
              // Store order ID for redirection
              const orderId = orderResult.orderId || orderResult.id || (orderResult.data?.orderId);
              console.log('✅ Order created with ID:', orderId);
              
              if (!orderId) {
                throw new Error('No order ID returned from server');
              }
              
              localStorage.setItem('orderId', orderId);
              localStorage.setItem('lastOrderId', orderId);
              
              // Small delay to ensure order is saved before navigation
              await new Promise(resolve => setTimeout(resolve, 500));
              
              console.log('🔄 Redirecting to payment success page with orderId:', orderId);
              // Redirect to payment success page
              router.push('/customer/payment/success');
            } else {
              throw new Error(orderResult.error || 'Failed to create order');
            }
          } catch (error) {
            console.error('❌ Order creation error:', error);
            toast.error('Payment succeeded but order creation failed. Please contact support.');
          }
        }
      }
    } catch (error) {
      toast.error("Payment processing failed. Please try again.");
      console.error("Payment processing error:", error);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        color: "#1f2937",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSmoothing: "antialiased",
        fontSize: "16px",
        fontWeight: "400",
        lineHeight: "24px",
        letterSpacing: "0",
        "::placeholder": {
          color: "rgba(156, 163, 175, 1)",
        },
      },
      invalid: {
        color: "#ef4444",
        iconColor: "#ef4444",
      },
    },
    hidePostalCode: true,
    classes: {
      base: "stripe-card-element",
      complete: "stripe-card-element--complete",
      empty: "stripe-card-element--empty",
      focus: "stripe-card-element--focus",
      invalid: "stripe-card-element--invalid",
      webkitAutofill: "stripe-card-element--webkit-autofill",
    },
  };

  // If order data is not loaded yet, show loading state
  if (!orderData) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading order data...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Card Information</h3>
        </div>
        <div className="p-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <CardElement options={cardElementOptions} />
          </div>
          <div className="mt-4 flex items-center text-gray-600 dark:text-gray-400 text-sm">
            <svg className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
            <span>Your payment details are securely encrypted</span>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Order Summary</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {orderData.items.map((item: any) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Qty: {item.quantity}
                  </p>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  ?{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>
          
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-amber-600 dark:text-amber-400">${orderData.total.toFixed(2)}</span>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
              </svg>
              <span>Pickup Time: {useCartStore.getState().timeSlot || 'Not selected'}</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={!stripe || loading}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center ${
          !stripe || loading
            ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay $${orderData.total.toFixed(2)}`
        )}
      </motion.button>
    </form>
  );
};

export default function StripePaymentPage() {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState("");
  const [orderData, setOrderData] = useState<any>(null);
  
  // Load order data from localStorage on component mount
  useEffect(() => {
    const storedOrderData = localStorage.getItem('orderData');
    if (storedOrderData) {
      try {
        const parsedData = JSON.parse(storedOrderData);
        setOrderData(parsedData);
        
        // Calculate total in cents for payment intent
        const total = parsedData.total;
        const totalInCents = Math.round(total * 100);
        
        // Create PaymentIntent
        fetch("/api/payments/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            amount: totalInCents,
            currency: "usd"
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.clientSecret) {
              setClientSecret(data.clientSecret);
            } else {
              toast.error("Failed to initialize payment. Please try again.");
              console.error("Failed to create payment intent:", data);
            }
          })
          .catch((error) => {
            toast.error("Failed to initialize payment. Please try again.");
            console.error("Error creating payment intent:", error);
          });
      } catch (error) {
        console.error('Error parsing order data:', error);
        toast.error("Failed to load order data. Please try again.");
        router.push('/payment');
      }
    } else {
      // If no order data, redirect back to payment
      router.push('/payment');
    }
  }, [router]);

  // If order data is not loaded yet, show loading state
  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center mb-8">
              <button 
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-4">Secure Payment</h1>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
                <p className="text-gray-900 dark:text-white font-medium mb-2">Loading Order Data</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we prepare your payment information...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center mb-8">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-4">Secure Payment</h1>
          </div>

          {/* Progress Indicator */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Step 3 of 3</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Payment</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <motion.div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              ></motion.div>
            </div>
          </div>
          
          {/* Security Notice */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">256-bit SSL Encryption</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Your payment details are securely encrypted and protected
                </p>
              </div>
            </div>
          </motion.div>

          {clientSecret ? (
            <Elements stripe={stripePromise}>
              <StripePaymentForm clientSecret={clientSecret} />
            </Elements>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center"
            >
              <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
              <p className="text-gray-900 dark:text-white font-medium mb-2">Initializing Payment</p>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Please wait while we prepare your secure payment session...
              </p>
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm"
          >
            <p>Powered by Stripe. Your payment details are never stored on our servers.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
