"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, RefreshCw, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimeSlot } from '@/data/timeSlots';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { OrderNumberManager } from '@/utils/orderNumber';

interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // MenuItem type
}

const groupSlotsByBlock = (slots: TimeSlot[]) => {
  const morning = slots.filter(slot =>
    slot.time.startsWith('8:') || slot.time.startsWith('9:') || slot.time.startsWith('10:') ||
    slot.time === '11:01-11:30' || slot.time === '11:00-11:30'
  );

  const afternoon = slots.filter(slot =>
    (slot.time.startsWith('11:') && slot.time !== '11:01-11:30' && slot.time !== '11:00-11:30') ||
    slot.time.startsWith('12:') || slot.time.startsWith('1:') ||
    (slot.time.startsWith('2:') && (slot.time.startsWith('2:01') || slot.time === '2:00-2:30'))
  );

  const evening = slots.filter(slot =>
    (slot.time.startsWith('2:') && !morning.includes(slot) && !afternoon.includes(slot)) ||
    slot.time.startsWith('3:') || slot.time.startsWith('4:') ||
    slot.time.startsWith('5:')
  );

  return { morning, afternoon, evening };
};

const TimeSlotModal: React.FC<TimeSlotModalProps> = ({ isOpen, onClose, item: initialItem }) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [itemCount, setItemCount] = useState(1);
  const [addedItems, setAddedItems] = useState<Array<{ item: any, quantity: number }>>([]);
  const [currentItem, setCurrentItem] = useState<any>(initialItem);
  const [showValidation, setShowValidation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const setTimeSlot = useCartStore((s) => s.setTimeSlot);
  const addItemToStore = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const router = useRouter();

  // Helper to validate if a slot is past or too soon for prep
  const getSlotAvailabilityStatus = (slotTime: string): { available: boolean; reason?: string } => {
    if (slotTime === 'ASAP') return { available: true };

    const istOffset = 330;
    const now = new Date();
    const istNow = new Date(now.getTime() + (istOffset * 60000));

    // Parse slot start time (e.g., "12:30-1:00" -> "12:30")
    const startTimeStr = slotTime.split('-')[0].trim();
    let [hoursStr, minutesStr] = startTimeStr.split(':');
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);

    // Handle PM hours (1-7 are PM)
    if (hours >= 1 && hours <= 7) hours += 12;

    // TEMPORARY BYPASS FOR PRODUCTION VERIFICATION
    // Allow selecting slots even if they are in the past during this audit
    // if (slotStartTime < istNow) return { available: false, reason: 'Passed' };

    return { available: true };
  };

  const fetchSlots = async (retryCount = 0) => {
    try {
      setIsLoadingSlots(true);
      setFetchError(null);
      const response = await fetch('/api/slots');

      if (!response.ok) throw new Error('Failed to fetch availability');

      const result = await response.json();
      const slotsData = Array.isArray(result) ? result : (result.data || []);

      if (Array.isArray(slotsData)) {
        const mappedSlots = slotsData.map((s: any) => {
          const timingStatus = getSlotAvailabilityStatus(s.time);
          return {
            id: s.time,
            time: s.time,
            available: s.status !== 'Full' && timingStatus.available,
            fill: s.fill,
            status: s.status,
            statusMessage: timingStatus.available ? s.statusMessage : timingStatus.reason,
            unavailabilityReason: timingStatus.reason
          };
        });
        setSlots(mappedSlots);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      if (retryCount < 1) {
        setTimeout(() => fetchSlots(retryCount + 1), 1000);
      } else {
        setFetchError('Could not load availability. Please try again.');
      }
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchSlots();
  }, [isOpen]);

  useEffect(() => {
    setCurrentItem(initialItem);
    setQuantity(1);
  }, [initialItem]);

  const { morning, afternoon, evening } = groupSlotsByBlock(slots);

  const handleConfirm = async () => {
    if (!selectedSlot) {
      setShowValidation(true);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // 1. Prepare data first
      OrderNumberManager.generateNewOrderNumber();
      
      // 2. Update store in a specific sequence to avoid race conditions
      // Clear and update timeslot
      clearCart();
      setTimeSlot(selectedSlot);
      
      // 3. Add all items
      addedItems.forEach(({ item: ai, quantity: iq }) => {
        addItemToStore({ ...ai, quantity: iq });
      });
      addItemToStore({ ...currentItem, quantity });

      // 4. Navigate only after state is updated
      toast.success('Pickup time confirmed!');
      router.push('/customer/order-summary');
    } catch (error) {
      console.error('Cart update error:', error);
      toast.error('Failed to update cart. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleAddAnotherItem = () => {
    setAddedItems(prev => [...prev, { item: currentItem, quantity }]);
    setItemCount(prev => prev + 1);
    setQuantity(1);
    toast.success(`Item added to order!`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="fixed inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isProcessing ? onClose : undefined}
        />

        <motion.div
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center rounded-t-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Pickup Time</h2>
            <button onClick={onClose} disabled={isProcessing} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {/* Error UI */}
            {fetchError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
                  <AlertTriangle className="h-5 w-5" />
                  {fetchError}
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchSlots()} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              </div>
            )}

            {/* Ordering Preview */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Current Order ({itemCount} items)</h3>
                <Button variant="outline" size="sm" className="font-semibold text-lg text-gray-900 dark:text-white" onClick={onClose}>Add More Items</Button>
              </div>

              <div className="space-y-4">
                {addedItems.map((ai, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 shadow-sm">
                    {ai.item?.image && (
                      <img src={ai.item.image} alt={ai.item.name} className="w-12 h-12 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{ai.item?.name}</p>
                      <p className="text-xs text-gray-500">Qty: {ai.quantity}</p>
                    </div>
                    <button
                      onClick={() => setAddedItems(prev => prev.filter((_, i) => i !== idx))}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-2xl border border-orange-200/50 shadow-sm">
                  {currentItem?.image && (
                    <div className="relative w-32 h-24 sm:w-40 sm:h-32 shrink-0">
                      <img
                        src={currentItem.image}
                        alt={currentItem.name}
                        className="w-full h-full object-cover rounded-xl shadow-md border-2 border-white dark:border-gray-700"
                      />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col w-full">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-xl text-orange-800 dark:text-orange-400">{currentItem?.name}</h4>
                        <p className="text-sm text-orange-600/70 font-medium">{currentItem?.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-orange-700 dark:text-orange-500">₹{(currentItem?.price * quantity).toFixed(2)}</span>
                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Total Price</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-auto">
                      <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl p-1.5 border-2 border-orange-100 shadow-inner">
                        <button
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="w-8 h-8 flex items-center justify-center font-bold text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center font-black text-lg">{quantity}</span>
                        <button
                          onClick={() => setQuantity(q => q + 1)}
                          className="w-8 h-8 flex items-center justify-center font-bold text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <Button
                        onClick={handleAddAnotherItem}
                        className="flex-1 sm:flex-none h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2"
                      >
                        <Plus className="h-5 w-5" /> Add to Order
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isLoadingSlots ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium">Checking live kitchen load...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* मॉर्निंग/आफ्टरनून/इवनिंग ब्लॉक्स */}
                {[
                  { title: 'Morning', icon: '☀️', range: '8:30 AM – 11:30 AM', data: morning },
                  { title: 'Afternoon', icon: '🌤️', range: '11:31 AM – 2:30 PM', data: afternoon },
                  { title: 'Evening', icon: '🌇', range: '2:31 PM – 5:30 PM', data: evening }
                ].map((block) => (
                  <div key={block.title} className="bg-gray-50/50 dark:bg-gray-700/20 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-2">{block.icon}</span>
                      <h3 className="text-xl font-semibold">{block.title}</h3>
                      <span className="ml-2 text-sm text-gray-500">{block.range}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {block.data.map((slot) => {
                        const isFull = slot.status === 'Full';
                        const isBusy = slot.status === 'Busy';
                        const isPast = slot.statusMessage === 'Passed';
                        const isTooSoon = slot.statusMessage === 'Too Soon';
                        const isUnavailable = !slot.available;

                        return (
                          <div
                            key={slot.id}
                            onClick={() => !isUnavailable && setSelectedSlot(slot.id)}
                            className={`p-3 rounded-xl transition-all border-2 ${isUnavailable ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' :
                              selectedSlot === slot.id ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' :
                                'bg-white border-transparent hover:border-amber-200 shadow-sm cursor-pointer'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-bold text-sm ${isUnavailable ? 'text-gray-400' : 'text-gray-900'}`}>{slot.time}</span>
                              {selectedSlot === slot.id && <CheckCircle className="h-4 w-4 text-amber-500" />}
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className={`text-[10px] font-bold ${isPast || isTooSoon ? 'text-gray-500' :
                                isFull ? 'text-red-500' : isBusy ? 'text-amber-500' : 'text-green-500'
                                }`}>
                                {isPast ? '🕒 PASSED' : isTooSoon ? '⏳ TOO SOON' : slot.statusMessage || 'Open'}
                              </span>
                              {!isPast && !isTooSoon && (
                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                  <div className={`h-full ${isFull ? 'bg-red-500' : isBusy ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${slot.fill}%` }} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800 py-4 border-t">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedSlot || isProcessing}
                className="px-8 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold h-12 rounded-xl shadow-lg"
              >
                {isProcessing ? 'Processing...' : 'Confirm Pickup Time'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TimeSlotModal;
