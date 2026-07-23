import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { aggregateTimeSlots } from '@/lib/slot-utils';
import { getStatusMessage } from '@/lib/slotCalculations';
import { cache } from '@/lib/cache';
import { successResponse, errorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting (public endpoint - use lenient limits)
    const identifier = getRateLimitIdentifier(req as Request);
    const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.LENIENT.limit, RateLimitPresets.LENIENT.windowMs);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

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
    // Authentication check for cache invalidation
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check - only admin can invalidate cache
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
