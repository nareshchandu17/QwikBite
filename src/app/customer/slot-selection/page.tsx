"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, ChevronLeft, CheckCircle, Sunrise, Sun, Sunset } from "lucide-react";
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cartStore';

// Mock time slots data
const timeSlots = [
  { id: "m-8-30", time: "8:30-9:00", period: "morning", available: true },
  { id: "m-9-01", time: "9:01-9:30", period: "morning", available: true },
  { id: "m-9-31", time: "9:31-10:00", period: "morning", available: true },
  { id: "m-10-01", time: "10:01-10:30", period: "morning", available: true },
  { id: "m-10-30", time: "10:30-11:00", period: "morning", available: true },
  { id: "m-11-01", time: "11:01-11:30", period: "morning", available: true },
  
  { id: "a-11-31", time: "11:31-12:00", period: "afternoon", available: true },
  { id: "a-12-01", time: "12:01-12:30", period: "afternoon", available: true },
  { id: "a-12-31", time: "12:31-1:00", period: "afternoon", available: true },
  { id: "a-1-01", time: "1:01-1:30", period: "afternoon", available: true },
  { id: "a-1-31", time: "1:31-2:00", period: "afternoon", available: true },
  { id: "a-2-01", time: "2:01-2:30", period: "afternoon", available: true },
  
  { id: "e-2-31", time: "2:31-3:00", period: "evening", available: true },
  { id: "e-3-01", time: "3:01-3:30", period: "evening", available: true },
  { id: "e-3-31", time: "3:31-4:00", period: "evening", available: true },
  { id: "e-4-01", time: "4:01-4:30", period: "evening", available: true },
  { id: "e-4-31", time: "4:31-5:00", period: "evening", available: true },
  { id: "e-5-01", time: "5:01-5:30", period: "evening", available: true },
];

// Group time slots by period
const groupedTimeSlots = () => {
  const morning = timeSlots.filter(slot => slot.period === "morning");
  const afternoon = timeSlots.filter(slot => slot.period === "afternoon");
  const evening = timeSlots.filter(slot => slot.period === "evening");
  
  return { morning, afternoon, evening };
};

export default function SlotSelectionPage() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const router = useRouter();
  const { morning, afternoon, evening } = groupedTimeSlots();
  const setTimeSlot = useCartStore(state => state.setTimeSlot);

  const handleConfirmSlot = () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }
    
    // Find the selected time slot details
    const slotDetails = timeSlots.find(slot => slot.id === selectedSlot);
    
    // Store the selected time slot in the cart store
    setTimeSlot(slotDetails?.time || selectedSlot);
    
    // Redirect immediately to order summary page
    router.push('/customer/order-summary');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-white ml-4">Select Pickup Time</h1>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Step 1 of 3</span>
            <span className="text-sm text-slate-400">Slot Selection</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-amber-500 h-2 rounded-full w-1/3"></div>
          </div>
        </div>

        {/* Selected Slot Display */}
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center"
          >
            <CheckCircle className="w-5 h-5 text-amber-400 mr-2" />
            <span className="text-amber-300">
              Selected slot: {timeSlots.find(slot => slot.id === selectedSlot)?.time}
            </span>
          </motion.div>
        )}

        {/* Time Slots */}
        <div className="space-y-8">
          {/* Morning Block */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center mb-6">
              <Sunrise className="w-6 h-6 text-amber-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Morning</h2>
              <span className="ml-3 text-sm text-slate-400">(8:30 AM – 11:30 AM)</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {morning.map((slot) => (
                <motion.button
                  key={slot.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => slot.available && setSelectedSlot(slot.id)}
                  disabled={!slot.available}
                  className={`p-4 rounded-xl text-center transition-all ${
                    selectedSlot === slot.id
                      ? "bg-amber-500 text-slate-900 font-medium"
                      : slot.available
                      ? "bg-slate-700/50 text-white hover:bg-slate-700"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Clock className="w-5 h-5 mx-auto mb-2" />
                  <span className="block text-sm">{slot.time}</span>
                  {!slot.available && (
                    <span className="block text-xs mt-1 text-slate-500">Full</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Afternoon Block */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center mb-6">
              <Sun className="w-6 h-6 text-amber-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Afternoon</h2>
              <span className="ml-3 text-sm text-slate-400">(11:31 AM – 2:30 PM)</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {afternoon.map((slot) => (
                <motion.button
                  key={slot.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => slot.available && setSelectedSlot(slot.id)}
                  disabled={!slot.available}
                  className={`p-4 rounded-xl text-center transition-all ${
                    selectedSlot === slot.id
                      ? "bg-amber-500 text-slate-900 font-medium"
                      : slot.available
                      ? "bg-slate-700/50 text-white hover:bg-slate-700"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Clock className="w-5 h-5 mx-auto mb-2" />
                  <span className="block text-sm">{slot.time}</span>
                  {!slot.available && (
                    <span className="block text-xs mt-1 text-slate-500">Full</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Evening Block */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center mb-6">
              <Sunset className="w-6 h-6 text-amber-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Evening</h2>
              <span className="ml-3 text-sm text-slate-400">(2:31 PM – 5:30 PM)</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {evening.map((slot) => (
                <motion.button
                  key={slot.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => slot.available && setSelectedSlot(slot.id)}
                  disabled={!slot.available}
                  className={`p-4 rounded-xl text-center transition-all ${
                    selectedSlot === slot.id
                      ? "bg-amber-500 text-slate-900 font-medium"
                      : slot.available
                      ? "bg-slate-700/50 text-white hover:bg-slate-700"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Clock className="w-5 h-5 mx-auto mb-2" />
                  <span className="block text-sm">{slot.time}</span>
                  {!slot.available && (
                    <span className="block text-xs mt-1 text-slate-500">Full</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="mt-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirmSlot}
            disabled={!selectedSlot}
            className={`w-full py-4 rounded-xl font-medium text-lg transition-all ${
              selectedSlot
                ? "bg-amber-500 hover:bg-amber-600 text-slate-900"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            Confirm Time Slot
          </motion.button>
          
          <p className="text-center text-slate-400 text-sm mt-4">
            Your order will be prepared for pickup at the selected time
          </p>
        </div>
      </div>
    </div>
  );
}