import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { aggregateTimeSlots, syncTimeSlotUsage } from '@/lib/slot-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';
import { pusherServer } from '@/lib/pusher';

export async function GET(req: NextRequest) {
    try {
        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Authorization check
        const userRole = (session.user as { role?: string }).role;
        if (!['admin', 'canteen_staff'].includes(userRole as any)) {
            return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.LENIENT.limit, RateLimitPresets.LENIENT.windowMs);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

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

export async function POST(req: NextRequest) {
    try {
        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Authorization check
        const userRole = (session.user as { role?: string }).role;
        if (!['admin', 'canteen_staff'].includes(userRole as any)) {
            return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        const body = await req.json();
        const { slots: updatedSlots } = body;

        if (!Array.isArray(updatedSlots)) {
            return NextResponse.json({ error: 'Invalid input: slots must be an array' }, { status: 400 });
        }

        await connectDB();

        // Update slot capacities in database
        const { TimeSlot } = await import('@/models/slot.model');
        const istOffset = 330;
        const now = new Date();
        const istTime = new Date(now.getTime() + (istOffset * 60000));
        const dateStr = istTime.toISOString().split('T')[0];

        const updatePromises = updatedSlots.map(async (slot: any) => {
            const { parseSlotToDates } = await import('@/lib/slot-utils');
            const { start } = parseSlotToDates(slot.timeSlot, dateStr);
            
            return TimeSlot.findOneAndUpdate(
                { dateOnly: dateStr, startTime: start },
                { 
                    $set: { 
                        maxLoad: slot.capacity,
                        isActive: true
                    }
                },
                { upsert: true, new: true }
            );
        });

        await Promise.all(updatePromises);

        // Trigger real-time update via Pusher
        await pusherServer.trigger('admin', 'slot-update', { 
            slots: updatedSlots,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({ success: true, message: 'Slots updated successfully' });
    } catch (error) {
        console.error('[Timeslots POST API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
