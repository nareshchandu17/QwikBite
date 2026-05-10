import { Order } from '@/lib/models/Order';
import { TimeSlot as TimeSlotModel } from '@/models/slot.model';
import { connectDB } from './db';

export const STANDARD_SLOTS = [
    "ASAP",
    "8:30-9:00", "9:01-9:30", "9:31-10:00", "10:01-10:30", "10:30-11:00", "11:01-11:30",
    "11:31-12:00", "12:01-12:30", "12:31-1:00", "1:01-1:30", "1:31-2:00", "2:01-2:30",
    "2:31-3:00", "3:01-3:30", "3:31-4:00", "4:01-4:30", "4:31-5:00", "5:01-5:30"
];

/**
 * Utility to parse slot string into start/end dates
 */
function parseSlotToDates(slotStr: string, dateStr: string): { start: Date, end: Date } {
    const [dateY, dateM, dateD] = dateStr.split('-').map(Number);
    const start = new Date(dateY, dateM - 1, dateD);
    const end = new Date(dateY, dateM - 1, dateD);

    if (slotStr === 'ASAP') {
        const now = new Date();
        return { start: now, end: new Date(now.getTime() + 30 * 60000) };
    }

    const [startPart, endPart] = slotStr.split('-');
    
    const parsePart = (part: string, d: Date) => {
        const parts = part.split(':').map(Number);
        let h = parts[0];
        const m = parts[1];
        // Basic heuristic: hours 1-7 are PM, 8-12 are AM/PM (assuming school hours)
        if (h < 8) h += 12;
        d.setHours(h, m, 0, 0);
    };

    parsePart(startPart, start);
    parsePart(endPart, end);
    return { start, end };
}

/**
 * Robustly syncs and recalculates slot usage based on actual orders.
 */
export async function syncTimeSlotUsage(targetDate?: string): Promise<void> {
    await connectDB();
    
    const istOffset = 330;
    const now = new Date();
    const istTime = new Date(now.getTime() + (istOffset * 60000));
    const dateStr = targetDate || istTime.toISOString().split('T')[0];

    console.log(`[Slot Sync] Reconciling for date: ${dateStr}...`);

    // 1. Get all active orders for this date
    const orders = await Order.find({ 
        pickupDate: dateStr,
        status: { $nin: ['cancelled', 'rejected'] } 
    }).lean();

    // 2. Aggregate load by slot string (legacy compatibility)
    const slotStats: Record<string, number> = {};
    orders.forEach(order => {
        const slot = order.timeSlot;
        if (!slotStats[slot]) slotStats[slot] = 0;
        slotStats[slot] += (order.loadValue || 0);
    });

    // 3. Update all slots
    const updatePromises = STANDARD_SLOTS.map(async (slotStr) => {
        const load = slotStats[slotStr] || 0;
        const { start, end } = parseSlotToDates(slotStr, dateStr);
        const maxLoad = 300; 

        return TimeSlotModel.findOneAndUpdate(
            { dateOnly: dateStr, startTime: start },
            { 
                $set: { 
                    endTime: end,
                    currentLoad: load,
                    maxLoad: maxLoad,
                    isActive: true
                }
            },
            { upsert: true, new: true }
        );
    });

    await Promise.all(updatePromises);
    console.log(`[Slot Sync] ✅ Successfully reconciled ${STANDARD_SLOTS.length} slots.`);
}

/**
 * FETCH: Retrieve from TimeSlot collection
 */
export async function aggregateTimeSlots() {
    await connectDB();

    const istOffset = 330;
    const now = new Date();
    const istTime = new Date(now.getTime() + (istOffset * 60000));
    const dateStr = istTime.toISOString().split('T')[0];

    const dbSlots = await TimeSlotModel.find({ dateOnly: dateStr }).sort({ startTime: 1 }).lean();
    const DEFAULT_MAX_LOAD = 300;

    return STANDARD_SLOTS.map(slot => {
        const { start } = parseSlotToDates(slot, dateStr);
        const dbMatch = dbSlots.find(ds => ds.startTime.getTime() === start.getTime());
        
        const currentLoad = dbMatch ? (dbMatch.currentLoad || 0) : 0;
        const maxLoad = dbMatch ? (dbMatch.maxLoad || DEFAULT_MAX_LOAD) : DEFAULT_MAX_LOAD;
        const percentage = Math.round((currentLoad / maxLoad) * 100);

        return {
            time: slot,
            timeSlot: slot,
            capacity: maxLoad,
            used: currentLoad,
            percentage,
            status: dbMatch?.status || (currentLoad >= maxLoad ? "full" : currentLoad >= (maxLoad * 0.7) ? "busy" : "open")
        };
    });
}
