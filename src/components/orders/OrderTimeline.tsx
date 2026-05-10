"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = ["Order Placed", "Preparing", "Ready", "Out for Delivery", "Delivered"];

export default function OrderTimeline({ status }: { status: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);

  useEffect(() => {
    const newIndex = steps.findIndex(s => {
      if (status === 'Pending') return s === 'Order Placed';
      if (status === 'Preparing') return s === 'Preparing';
      if (status === 'Ready') return s === 'Ready';
      if (status === 'Out for Delivery') return s === 'Out for Delivery';
      if (status === 'Delivered') return s === 'Delivered';
      return s === 'Order Placed';
    });
    
    setActiveIndex(newIndex >= 0 ? newIndex : 0);
    
    // Update completed indices
    const completed = [];
    for (let i = 0; i <= newIndex; i++) {
      completed.push(i);
    }
    setCompletedIndices(completed);
  }, [status]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((s, i) => {
          const isActive = i === activeIndex;
          const isCompleted = completedIndices.includes(i);
          
          return (
            <div key={s} className="flex-1 flex flex-col items-center text-center px-2 relative">
              <motion.div 
                animate={{ 
                  scale: isActive ? 1.2 : 1,
                  backgroundColor: isCompleted ? "#f59e0b" : "#374151",
                  color: isCompleted ? "#000" : "#9ca3af"
                }} 
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm z-10 relative`}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                ) : (
                  i + 1
                )}
              </motion.div>
              <motion.div 
                className={`text-xs mt-2 font-medium ${isActive ? 'text-amber-300' : isCompleted ? 'text-amber-200' : 'text-slate-400'}`}
                animate={{ 
                  scale: isActive ? 1.05 : 1,
                  fontWeight: isActive ? 'bold' : 'normal'
                }}
              >
                {s}
              </motion.div>
              
              {/* Pulsing animation for active step */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 w-12 h-12 rounded-full bg-amber-400 opacity-30"
                  animate={{
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress line with animation */}
      <div className="h-1.5 bg-slate-800 rounded-full relative overflow-hidden">
        <motion.div 
          className="absolute left-0 top-0 h-full rounded-full bg-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${(Math.max(0, activeIndex) / (steps.length - 1)) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
        
        {/* Animated progress glow */}
        <motion.div
          className="absolute top-0 left-0 h-full w-8 bg-amber-200 rounded-full opacity-50"
          animate={{
            left: `${(Math.max(0, activeIndex) / (steps.length - 1)) * 100 - 5}%`,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
      </div>
      
      {/* Status message */}
      <AnimatePresence>
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-4 text-center"
        >
          <p className="text-amber-300 font-medium">
            {getStatusMessage(status)}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const getStatusMessage = (status: string) => {
  switch (status) {
    case 'Pending':
      return "Your order has been received and is being processed";
    case 'Preparing':
      return "Your order is now being prepared by our chefs";
    case 'Ready':
      return "Your order is ready for pickup";
    case 'Out for Delivery':
      return "Your order is on its way to you";
    case 'Delivered':
      return "Your order has been successfully delivered";
    default:
      return "Order status updated";
  }
};