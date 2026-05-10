import { SlotSelectionResult, EnrichedContext } from '../types';
import { connectDB } from '@/lib/db';
import { aggregateTimeSlots } from '@/lib/slot-utils';

/**
 * Select a time slot for order pickup
 */
export async function selectSlot(
    params: {
        slotId?: string;
        preference?: 'earliest' | 'least_busy';
    },
    _context: EnrichedContext
): Promise<SlotSelectionResult> {
    await connectDB();

    const slots = await aggregateTimeSlots();
    const now = new Date();

    // Filter future slots
    const availableSlots = slots.filter(slot => {
        // Parse time from "HH:MM-HH:MM" format or use standard date if available
        // Since we know these are today's slots (from aggregateTimeSlots), we create a date object
        const startTime = slot.timeSlot.split('-')[0]; // "8:30"
        if (startTime === 'ASAP') return true;

        const [hours, minutes] = startTime.split(':').map(Number);
        const slotDate = new Date();
        slotDate.setHours(hours, minutes, 0, 0);

        return slotDate > now;
    });

    if (availableSlots.length === 0) {
        throw new Error('No available slots found');
    }

    let selectedSlot;

    if (params.slotId) {
        // Find specific slot
        selectedSlot = availableSlots.find(s => s.timeSlot === params.slotId);
        if (!selectedSlot) {
            throw new Error('Requested slot not found');
        }
    } else if (params.preference === 'earliest') {
        // Select earliest available slot
        selectedSlot = availableSlots[0];
    } else if (params.preference === 'least_busy') {
        // Select slot with lowest load
        selectedSlot = availableSlots.reduce((min, slot) =>
            (slot.used || 0) < (min.used || 0) ? slot : min
        );
    } else {
        // Default to earliest
        selectedSlot = availableSlots[0];
    }

    const capacity = selectedSlot.capacity || 20;
    const currentLoad = selectedSlot.used || 0;

    // Check if slot is full
    if (currentLoad >= capacity) {
        throw new Error(`Slot is full (${currentLoad}/${capacity})`);
    }

    // Calculate estimated wait time based on queue
    const estimatedWaitTime = Math.max(15, currentLoad * 2); // 2 min per order in queue

    return {
        slot: {
            id: selectedSlot.timeSlot,
            time: selectedSlot.timeSlot,
            capacity,
            currentLoad
        },
        reserved: true,
        estimatedWaitTime,
        message: `Slot selected: ${selectedSlot.timeSlot} (${currentLoad}/${capacity} orders, ~${estimatedWaitTime} min wait)`
    };
}

/**
 * Get available slots with load information
 */
export async function getAvailableSlots(
    params: {
        hoursAhead?: number;
    },
    _context: EnrichedContext
): Promise<{
    slots: Array<{
        id: string;
        time: string;
        capacity: number;
        currentLoad: number;
        available: boolean;
    }>;
    message: string;
}> {
    await connectDB();

    const hoursAhead = params.hoursAhead || 2;
    const slots = await aggregateTimeSlots();
    const now = new Date();
    const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const availableSlots = slots
        .filter(slot => {
            const startTime = slot.timeSlot.split('-')[0];
            if (startTime === 'ASAP') return true;

            const [hours, minutes] = startTime.split(':').map(Number);
            const slotDate = new Date();
            slotDate.setHours(hours, minutes, 0, 0);

            return slotDate > now && slotDate <= cutoff;
        })
        .map(slot => {
            const capacity = slot.capacity || 20;
            const currentLoad = slot.used || 0;

            return {
                id: slot.timeSlot,
                time: slot.timeSlot,
                capacity,
                currentLoad,
                available: currentLoad < capacity
            };
        })
        .slice(0, 10);

    return {
        slots: availableSlots,
        message: `Found ${availableSlots.length} available slots in next ${hoursAhead} hours`
    };
}
