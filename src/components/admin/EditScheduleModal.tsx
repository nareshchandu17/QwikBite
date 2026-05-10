"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TimeSlot } from '@/types/slot';

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeSlots: TimeSlot[];
  onSave: (updatedSlots: TimeSlot[]) => void;
}

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({ 
  isOpen, 
  onClose, 
  timeSlots,
  onSave 
}) => {
  const [editedSlots, setEditedSlots] = useState<TimeSlot[]>([...timeSlots]);

  const handleStatusChange = (index: number, status: 'Open' | 'Busy' | 'Full') => {
    const updatedSlots = [...editedSlots];
    updatedSlots[index] = { ...updatedSlots[index], status };
    setEditedSlots(updatedSlots);
  };

  const handleSave = () => {
    onSave(editedSlots);
    onClose();
    toast.success('Schedule updated successfully!');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="w-full max-w-2xl bg-white/90 dark:bg-gray-800/95 rounded-xl shadow-xl overflow-hidden backdrop-blur-lg border border-white/10"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10 dark:border-gray-700 bg-white/5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Schedule</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-3">
              {editedSlots.map((slot, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-white/20 dark:border-gray-600/50 backdrop-blur-sm">
                  <span className="font-medium w-40 text-gray-800 dark:text-gray-100">{slot.time}</span>
                  <select
                    value={slot.status}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'Open' || value === 'Busy' || value === 'Full') {
                        handleStatusChange(index, value);
                      }
                    }}
                    className="px-3 py-2 border rounded-md bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="Open" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Open</option>
                    <option value="Busy" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Busy</option>
                    <option value="Full" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Full</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 p-4 border-t border-white/10 dark:border-gray-700 bg-white/5">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditScheduleModal;
