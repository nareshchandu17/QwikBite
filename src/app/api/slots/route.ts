import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { aggregateTimeSlots } from '@/lib/slot-utils';
import { getStatusMessage } from '@/lib/slotCalculations';
import { cache } from '@/lib/cache';
import { successResponse, errorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const CACHE_KEY = 'slots:available';

    // 1. Check Cache
    const cachedData = cache.get(CACHE_KEY);
    if (cachedData) {
      return successResponse(cachedData);
    }

    await connectDB();
    
    // 2. Database Fetch & Aggregation
    const slotsWithData = await aggregateTimeSlots();
    
    // Add status message for the UI
    const enhancedSlots = slotsWithData.map(slot => {
      const normalizedStatus = (slot.status.charAt(0).toUpperCase() + slot.status.slice(1)) as 'Open' | 'Busy' | 'Full';
      return {
        ...slot,
        time: slot.timeSlot,
        fill: slot.percentage,
        status: normalizedStatus,
        statusMessage: getStatusMessage(normalizedStatus)
      };
    });

    // 3. Store in Cache (20s)
    cache.set(CACHE_KEY, enhancedSlots, 20);
    
    return successResponse(enhancedSlots);
  } catch (error) {
    logger.error('Failed to fetch slot availability', error);
    return errorResponse('Failed to fetch slots', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Force invalidation manually
    cache.del('slots:available');
    logger.info('Slot cache manually invalidated');
    
    return successResponse({ 
      message: 'Slot cache invalidated successfully' 
    });
  } catch (error) {
    logger.error('Failed to invalidate slot cache', error);
    return errorResponse('Failed to process request', 500);
  }
}
