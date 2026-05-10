import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { TimeSlot as TimeSlotModel } from '@/models/slot.model';

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const istOffset = 330; 
        const now = new Date();
        const istTime = new Date(now.getTime() + (istOffset * 60000));
        const dateStr = istTime.toISOString().split('T')[0];

        console.log(`[Debug] Checking for date: ${dateStr}`);

        // Get all orders with time slots
        const orders = await Order.find({ 
            pickupDate: dateStr,
            status: { $ne: 'cancelled' }
        }).select('timeSlot pickupDate').lean();

        console.log(`[Debug] Found ${orders.length} orders for ${dateStr}`);

        // Group by time slot string (as stored in Order model)
        const timeSlotCounts: Record<string, number> = {};
        orders.forEach(order => {
            const slot = order.timeSlot || 'undefined';
            timeSlotCounts[slot] = (timeSlotCounts[slot] || 0) + 1;
        });

        // Check current timeslots collection
        const currentSlots = await TimeSlotModel.find({ dateOnly: dateStr }).sort({ startTime: 1 }).lean();
        console.log(`[Debug] Current timeslots in DB: ${currentSlots.length}`);

        return NextResponse.json({
            date: dateStr,
            totalOrders: orders.length,
            timeSlotCounts,
            currentSlots: currentSlots.map(s => ({
                id: s._id,
                startTime: s.startTime,
                dateOnly: s.dateOnly,
                currentLoad: s.currentLoad,
                maxLoad: s.maxLoad,
                status: s.status,
                isActive: s.isActive
            })),
            success: true
        });

    } catch (error) {
        console.error('[Debug Error]', error);
        return NextResponse.json({ 
            error: 'Debug failed',
            details: (error as Error).message 
        }, { status: 500 });
    }
}
