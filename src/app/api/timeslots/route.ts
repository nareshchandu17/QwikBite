import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { aggregateTimeSlots } from '@/lib/slot-utils';

// GET slots
export async function GET() {
  try {
    await connectDB();
    const slots = await aggregateTimeSlots();
    return NextResponse.json(slots);
  } catch (error) {
    console.error('GET /api/timeslots error:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}

// UPDATE slots (Admin only)
export async function POST(req: Request) {
  // In a real app, verify admin session here
  await connectDB();
  // This logic should probably use syncTimeSlotUsage instead of direct insert
  const { syncTimeSlotUsage } = await import('@/lib/slot-utils');
  await syncTimeSlotUsage();

  return NextResponse.json({ success: true, message: 'Slots synchronized' });
}
