'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Clock, Truck, Package, AlertTriangle, ArrowLeft, ShoppingBag, CreditCard, Shield, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { OrderNumberManager } from '@/utils/orderNumber';
import TimeSlotModal from '@/components/TimeSlotModal';

type MenuItem = {
  id: string | number;
  name?: string;
  price?: number;
  image?: string;
  color?: string;
  [key: string]: unknown;
};

interface CartItem {
  id: number;
  item: MenuItem;
  quantity: number;
}

interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
}

const formatTimeSlot = (slot: string): string => {
  if (!slot) return slot;
  
  console.log('[Order Summary] Original time slot:', slot);
  console.log('[Order Summary] Slot type:', typeof slot);
  console.log('[Order Summary] Slot length:', slot.length);
  
  // If slot is already in format "8:30-8:45", return as is
  if (slot.includes('-') && slot.match(/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/)) {
    console.log('[Order Summary] Already formatted time slot:', slot);
    return slot;
  }
  
  // Handle TimeSlotModal formats like "m-8-30" -> "8:30-8:45"
  if (slot.includes('-') && slot.match(/^[m,a,e]-\d{1,2}-\d{2}$/)) {
    const parts = slot.split('-');
    if (parts.length === 3) {
      const [session, hour, min] = parts;
      const startHour = parseInt(hour);
      const startMin = parseInt(min);
      
      console.log('[Order Summary] Parsed session slot:', { session, hour: startHour, min: startMin });
      
      // Convert to 12-hour format
      const displayHour = startHour > 12 ? startHour - 12 : startHour;
      const endMin = startMin + 15;
      let endHour = startHour;
      
      // Handle minute overflow
      if (endMin >= 60) {
        endHour = startHour + 1;
        const adjustedEndMin = endMin - 60;
        const displayEndHour = endHour > 12 ? endHour - 12 : endHour;
        const formatted = `${displayHour}:${startMin.toString().padStart(2, '0')}-${displayEndHour}:${adjustedEndMin.toString().padStart(2, '0')}`;
        console.log('[Order Summary] Formatted session slot with overflow:', formatted);
        return formatted;
      } else {
        const displayEndHour = endHour > 12 ? endHour - 12 : endHour;
        const formatted = `${displayHour}:${startMin.toString().padStart(2, '0')}-${displayEndHour}:${endMin.toString().padStart(2, '0')}`;
        console.log('[Order Summary] Formatted session slot:', formatted);
        return formatted;
      }
    }
  }
  
  // Handle formats like "e-15-00" -> "3:00-3:15" (15-minute gap)
  if (slot.includes('-') && slot.match(/^[a-z]-\d{2}-\d{2}$/)) {
    const parts = slot.split('-');
    if (parts.length === 3) {
      const [, startHour, startMin] = parts;
      const hour = parseInt(startHour);
      const min = parseInt(startMin);
      
      // Convert to 12-hour format
      const displayHour = hour > 12 ? hour - 12 : hour;
      const endMin = min + 15;
      let endHour = hour;
      
      // Handle minute overflow
      if (endMin >= 60) {
        endHour = hour + 1;
        const adjustedEndMin = endMin - 60;
        const displayEndHour = endHour > 12 ? endHour - 12 : endHour;
        const formatted = `${displayHour}:${min.toString().padStart(2, '0')}-${displayEndHour}:${adjustedEndMin.toString().padStart(2, '0')}`;
        console.log('[Order Summary] Formatted time slot:', formatted);
        return formatted;
      } else {
        const displayEndHour = endHour > 12 ? endHour - 12 : endHour;
        const formatted = `${displayHour}:${min.toString().padStart(2, '0')}-${displayEndHour}:${endMin.toString().padStart(2, '0')}`;
        console.log('[Order Summary] Formatted time slot:', formatted);
        return formatted;
      }
    }
  }
  
  // Handle standard time formats like "9:00", "14:30", etc.
  if (slot.includes(':')) {
    const [time] = slot.split(' ');
    const [hour, min] = time.split(':').map(Number);
    
    if (!isNaN(hour) && !isNaN(min)) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      const endMin = min + 15;
      let endHour = hour;
      
      // Handle minute overflow
      if (endMin >= 60) {
        endHour = hour + 1;
        const adjustedEndMin = endMin - 60;
        const displayEndHour = endHour > 12 ? endHour - 12 : endHour;
        const formatted = `${displayHour}:${min.toString().padStart(2, '0')}-${displayEndHour}:${adjustedEndMin.toString().padStart(2, '0')}`;
        console.log('[Order Summary] Formatted standard time:', formatted);
        return formatted;
      } else {
        const displayEndHour = endHour > 12 ? endHour - 12 : endHour;
        const formatted = `${displayHour}:${min.toString().padStart(2, '0')}-${displayEndHour}:${endMin.toString().padStart(2, '0')}`;
        console.log('[Order Summary] Formatted standard time:', formatted);
        return formatted;
      }
    }
  }
  
  // Normalize the slot to match our standard format
  const normalize = (s: string) => {
    return s.toString()
      .toLowerCase()
      .replace(/\s+/g, '') // Remove spaces
      .replace(/am|pm/g, '') // Remove AM/PM
      .replace(/^m-/g, '') // Remove "m-" prefix only at start
      .replace(/-(\d)/g, ':$1') // Replace hyphens before numbers with colons
      .replace(/\b0+(\d+)/g, '$1') // Remove leading zeros
      .replace(/:0+(\d+)/g, ':$1'); // Remove leading zeros after colon
  };
  
  const norm = normalize(slot);
  
  // Map specific time slots to standard format
  const slotMappings: Record<string, string> = {
    '8:30': '8:30-8:45',
    '9:00': '9:00-9:15',
    '9:30': '9:30-9:45',
    '10:00': '10:00-10:15',
    '10:30': '10:30-10:45',
    '11:00': '11:00-11:15',
    '11:30': '11:30-11:45',
    '12:00': '12:00-12:15',
    '12:30': '12:30-12:45',
    '1:00': '1:00-1:15',
    '1:30': '1:30-1:45',
    '2:00': '2:00-2:15',
    '2:30': '2:30-2:45',
    '3:00': '3:00-3:15',
    '3:30': '3:30-3:45',
    '4:00': '4:00-4:15',
    '4:30': '4:30-4:45',
    '5:00': '5:00-5:15',
    '5:30': '5:30-5:45',
    '6:00': '6:00-6:15',
    '6:30': '6:30-6:45',
    '7:00': '7:00-7:15',
    '7:30': '7:30-7:45',
    '8:00': '8:00-8:15',
    'asap': 'ASAP'
  };
  
  // Return mapped slot or original if no mapping found
  const result = slotMappings[norm] || slot;
  console.log('[Order Summary] Final time slot result:', result);
  return result;
};

export default function OrderSummaryPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const cart = useCartStore((state) => state.items);
  const timeSlot = useCartStore((state) => state.timeSlot);
  
  console.log('[Order Summary] Current timeSlot from store:', timeSlot);
  console.log('[Order Summary] TimeSlot type:', typeof timeSlot);
  
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [showTimeSlotModal, setShowTimeSlotModal] = useState<boolean>(false);
  console.log('[Order Summary] showTimeSlotModal state:', showTimeSlotModal);
  const [totals, setTotals] = useState<OrderTotals>({ 
    subtotal: 0, 
    tax: 0, 
    total: 0 
  });

  // Calculate order totals
  const calculateTotals = useCallback((items: CartItem[]) => {
    if (!items || !Array.isArray(items)) {
      return { subtotal: 0, tax: 0, total: 0 };
    }
    const subtotal = items.reduce((sum, item) => {
      const itemPrice = item.item.price || 0;
      return sum + (itemPrice * item.quantity);
    }, 0);
    const taxRate = 0.05; // 5% tax rate
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  }, []);

  // Initialize component
  useEffect(() => {
    setIsVisible(true);
    const calculatedTotals = calculateTotals(cart);
    setTotals(calculatedTotals);
    
    // Initialize or get existing order number
    const currentOrderNumber = OrderNumberManager.getCurrentOrderNumber();
    setOrderNumber(currentOrderNumber);
  }, [cart, calculateTotals]);

  // Handle payment process
  const handlePayment = useCallback(async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to continue with payment');
      router.push('/auth/signin');
      return;
    }

    if (!timeSlot) {
      toast.error('Please select a pickup time slot before proceeding to payment');
      setShowTimeSlotModal(true);
      return;
    }

    setIsLoading(true);
    try {
      // Here you would typically make an API call to process the payment
      // For now, we'll just simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Payment successful!');
      // Redirect to order confirmation or home page
      router.push('/order-confirmation');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, router, timeSlot, setShowTimeSlotModal]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (!isVisible) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mb-4">
            <ShoppingBag className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="animate-pulse text-gray-600 font-medium">Preparing your order summary...</div>
        </div>
      </div>
    );
  }

  // Get current date for order
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-amber-200 mb-4">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Premium Order Experience</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Order Summary
          </h1>
          <p className="text-gray-600">Review your delicious selections before checkout</p>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => {
              console.log('[Order Summary] Back button clicked, opening modal');
              setShowTimeSlotModal(true);
            }}
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Change Time Slot
          </button>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Details - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Order Status Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Order Confirmed</p>
                      <p className="text-amber-100 text-sm">Ready for payment processing</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                      {isLoading ? 'Processing...' : 'Secure Checkout'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-amber-600 text-xs font-medium mb-1">Order Number</p>
                    <p className="text-amber-900 font-bold text-lg">{orderNumber}</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-orange-600 text-xs font-medium mb-1">Date</p>
                    <p className="text-orange-900 font-bold text-lg">{currentDate.split(',')[0]}</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-yellow-600 text-xs font-medium mb-1">Total</p>
                    <p className="text-yellow-900 font-bold text-lg">{formatCurrency(totals.total)}</p>
                  </div>
                </div>

                {/* Time Slot Selection */}
                <div className="space-y-4">
                  {timeSlot ? (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Pickup Time</p>
                          <p className="text-blue-900 font-semibold">{formatTimeSlot(timeSlot)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowTimeSlotModal(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          <div>
                            <p className="text-orange-600 text-sm font-medium">Pickup Time Required</p>
                            <p className="text-orange-900 font-semibold">Select your preferred time slot</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowTimeSlotModal(true)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                        >
                          Select Time
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-amber-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Your Items</h3>
                <div className="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-full">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700 font-medium text-sm">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {cart.length > 0 ? (
                  cart.map((cartItem, index) => (
                    <motion.div
                      key={`${cartItem.id}-${index}-${cartItem.item.name || cartItem.item.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-start gap-4 p-4 rounded-xl border ${index < cart.length - 1 ? 'mb-4' : ''} ${
                        index % 2 === 0 ? 'bg-amber-50 border-amber-200' : 'bg-orange-50 border-orange-200'
                      }`}
                    >
                      <div className="w-20 h-20 bg-white rounded-xl shadow-sm overflow-hidden flex items-center justify-center shrink-0 border border-gray-200">
                        {cartItem.item.image ? (
                          <img
                            src={cartItem.item.image}
                            alt={cartItem.item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg">{cartItem.item.name}</h4>
                        {cartItem.item.color && (
                          <p className="text-gray-600 text-sm mt-1">Color: {cartItem.item.color}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700 border border-gray-200">
                            Qty: {cartItem.quantity}
                          </span>
                          <span className="text-gray-600 text-sm">
                            {formatCurrency(cartItem.item.price)} each
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(cartItem.item.price * cartItem.quantity)}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Your cart is empty</p>
                    <button
                      onClick={() => setShowTimeSlotModal(true)}
                      className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium mt-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Select Time Slot
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Sidebar - Order Summary & Payment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-amber-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600 font-medium">Delivery</span>
                  </div>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">GST (5%)</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(totals.tax)}</span>
                </div>
                
                <div className="border-t-2 border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {formatCurrency(totals.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-green-800 font-semibold">Secure Payment</p>
                  <p className="text-green-600 text-sm">Your transaction is protected</p>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Show loading state immediately
                setIsLoading(true);
                
                // Save cart data as orderData to localStorage before navigating to payment
                const orderData = {
                  id: orderNumber, // Use persistent order number
                  items: cart.map(item => ({
                    id: item.item.id,
                    name: item.item.name || 'Item',
                    quantity: item.quantity,
                    price: item.item.price || 0,
                    image: item.item.image
                  })),
                  total: totals.total,
                  subtotal: totals.subtotal,
                  tax: totals.tax,
                  timeSlot: timeSlot,
                  status: 'pending'
                };
                
                console.log('[Order Summary] ✅ Saving orderData to localStorage:', orderData);
                
                // Use synchronous localStorage for faster operation
                try {
                  localStorage.setItem('orderData', JSON.stringify(orderData));
                  console.log('[Order Summary] ✅ Data saved successfully');
                  
                  // Navigate immediately after saving
                  router.push('/customer/payment');
                } catch (error) {
                  console.error('[Order Summary] ❌ Error saving data:', error);
                  toast.error('Error preparing payment. Please try again.');
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Payment</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            {/* Help Section */}
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">
                Need help with your order?
              </p>
              <button 
                onClick={() => router.push('/contact')} 
                className="text-amber-600 hover:text-amber-700 font-medium text-sm flex items-center gap-2 mx-auto"
              >
                <AlertTriangle className="w-4 h-4" />
                Contact Support
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Time Slot Modal */}
      <TimeSlotModal
        isOpen={showTimeSlotModal}
        onClose={() => {
          console.log('[Order Summary] TimeSlotModal onClose called');
          setShowTimeSlotModal(false);
        }}
        item={null} // No specific item, just for time slot selection
      />
    </div>
  );
}
