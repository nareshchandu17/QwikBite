import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { aggregateTimeSlots, syncTimeSlotUsage } from '@/lib/slot-utils';

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        // Ensure data is synced before fetching
        await syncTimeSlotUsage();

        const slots = await aggregateTimeSlots();
        return NextResponse.json(slots);
    } catch (error) {
        console.error('[Timeslots API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
