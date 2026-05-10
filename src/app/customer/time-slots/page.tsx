"use client";

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, ShoppingBag, CheckCircle } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import TimeSlotCard from '@/components/TimeSlotCard';
import groupedTimeSlots from '@/data/timeSlots';
import { useCartStore } from '@/stores/cartStore';

export default function TimeSlotsPage() {
  const searchParams = useSearchParams();
  const items = useCartStore((s) => s.items);
  const timeSlot = useCartStore((s) => s.timeSlot);
  const { morning, afternoon, evening } = groupedTimeSlots();

  // Handle itemId from query params
  useEffect(() => {
    const itemId = searchParams.get('itemId');
    if (itemId) {
      // Fetch the item details based on itemId
      // For now, we'll just log it. You'll need to implement the actual fetch logic
      console.log('Item ID from URL:', itemId);
      
      // Example of how you might add the item to cart
      // const item = await fetchItemById(itemId);
      // if (item) {
      //   addToCart(item);
      // }
    }
  }, [searchParams]);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const hasTimeSlot = timeSlot !== null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  } as const;

  if (totalItems === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16 max-w-lg mx-auto">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                <ShoppingBag className="h-20 w-20 text-gray-300 dark:text-gray-700 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Your cart is empty</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Add some delicious items from our menu before selecting a time slot.</p>
                <Link href="/menu" className="btn btn-primary">Browse Menu</Link>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-10">
              <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Select a Pickup Time</h1>
              <p className="text-gray-600 dark:text-gray-400">Choose a convenient time slot to pick up your order. We&apos;ll have it ready for you!</p>
            </div>

            <div className="mb-6 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-amber-500" />
              <span className="font-medium">Today, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
            </div>

            {/* Selected Time Slot Display */}
            {hasTimeSlot && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-amber-600 mr-2" />
                  <span className="font-medium text-amber-800 dark:text-amber-200">Selected Time Slot:</span>
                </div>
                <p className="mt-2 text-lg font-semibold text-amber-900 dark:text-amber-100">
                  {timeSlot}
                </p>
              </div>
            )}

            <div className="space-y-8 mb-10">
              {/* Morning Block */}
              <div className="bg-white/50 dark:bg-gray-700/30 rounded-xl p-5 glass-card">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-2">☀️</span>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Morning</h3>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(8:30 AM – 11:00 AM)</span>
                </div>
                <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" variants={containerVariants} initial="hidden" animate="visible">
                  {morning.map((slot) => (
                    <motion.div key={slot.id} variants={itemVariants}>
                      <TimeSlotCard slot={slot} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Afternoon Block */}
              <div className="bg-white/50 dark:bg-gray-700/30 rounded-xl p-5 glass-card">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-2">🌤️</span>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Afternoon</h3>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(11:00 AM – 2:30 PM)</span>
                </div>
                <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" variants={containerVariants} initial="hidden" animate="visible">
                  {afternoon.map((slot) => (
                    <motion.div key={slot.id} variants={itemVariants}>
                      <TimeSlotCard slot={slot} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Evening Block */}
              <div className="bg-white/50 dark:bg-gray-700/30 rounded-xl p-5 glass-card">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-2">🌇</span>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Evening</h3>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(2:30 PM – 4:30 PM)</span>
                </div>
                <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" variants={containerVariants} initial="hidden" animate="visible">
                  {evening.map((slot) => (
                    <motion.div key={slot.id} variants={itemVariants}>
                      <TimeSlotCard slot={slot} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
              <Link href="/menu" className="btn btn-ghost flex items-center">Back to Menu</Link>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                {hasTimeSlot ? (
                  <Link href="/customer/order-summary" className="btn btn-primary flex items-center">
                    <span>Continue to Order Summary</span>
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <span className="btn bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed">Select a Time Slot to Continue</span>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}