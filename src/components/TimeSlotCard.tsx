"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle } from 'lucide-react';
import { TimeSlot } from '@/data/timeSlots';
import { useCartStore } from '@/stores/cartStore';

interface TimeSlotCardProps {
  slot: TimeSlot;
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({ slot }) => {
  const timeSlot = useCartStore((s) => s.timeSlot);
  const setTimeSlot = useCartStore((s) => s.setTimeSlot);
  const isSelected = timeSlot === slot.id;

  const handleSelectTimeSlot = () => {
    if (slot.available) setTimeSlot(slot.id);
  };

  return (
    <motion.div
      className={`p-3 rounded-xl transition-all duration-200 cursor-pointer text-center ${
        !slot.available
          ? 'bg-gray-100 dark:bg-gray-700/50 opacity-50 cursor-not-allowed'
          : isSelected
          ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500'
          : 'bg-white dark:bg-gray-700 hover:shadow-md border border-gray-200 dark:border-gray-600'
      }`}
      whileHover={slot.available && !isSelected ? { y: -3 } : {}}
      whileTap={slot.available ? { scale: 0.98 } : {}}
      onClick={handleSelectTimeSlot}
    >
      <div className="flex items-center justify-center">
        <Clock className={`h-4 w-4 mr-2 ${isSelected ? 'text-amber-600' : 'text-gray-500'}`} />
        <span className={`font-medium ${isSelected ? 'text-amber-700 dark:text-amber-300' : 'text-gray-700 dark:text-gray-200'}`}>
          {slot.time}
        </span>
        {isSelected && <CheckCircle className="h-4 w-4 ml-2 text-amber-600" />}
      </div>
    </motion.div>
  );
};

export default TimeSlotCard;