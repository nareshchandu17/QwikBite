import { connectDB } from '@/lib/db';
import { MenuItem } from '@/models/menuItem.model';
import { cache } from '@/lib/cache';
import { successResponse, errorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const CACHE_KEY = 'menu:popular';
    
    // 1. Check Cache
    const cachedData = cache.get(CACHE_KEY);
    if (cachedData) {
      return successResponse({ data: cachedData, cached: true });
    }

    // 2. Database Fetch
    await connectDB();
    const popularItems = await MenuItem.find({ 
      isAvailable: true,
      $or: [
        { isPopular: true },
        { rating: { $gte: 4.5 } }
      ]
    })
    .sort({ rating: -1, totalOrders: -1 })
    .limit(10)
    .lean();

    // 3. Store in Cache (120s TTL)
    cache.set(CACHE_KEY, popularItems, 120);

    return successResponse({ 
      data: popularItems, 
      cached: false 
    });
  } catch (error) {
    logger.error('Failed to fetch popular items', error);
    return errorResponse('Failed to fetch popular items', 500);
  }
}
