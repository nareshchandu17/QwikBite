import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { MenuItem } from '@/models/menuItem.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cache } from '@/lib/cache';
import { successResponse, errorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';
import { pusherServer } from '@/lib/pusher';
import { menuItems as fallbackMenuItems } from '@/data/menu';

type ClientMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  calories: number;
  image: string;
  category: string;
  tags: string[];
  available: boolean;
  prep_time?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;
  isPopular?: boolean;
  rating?: number;
  totalOrders?: number;
};

function toClientMenuItem(item: any): ClientMenuItem {
  const id = String(item?._id ?? item?.id ?? '');
  return {
    id,
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: Number(item?.price ?? 0),
    originalPrice: item?.originalPrice,
    calories: Number(item?.nutritionInfo?.calories ?? item?.calories ?? 0),
    image: item?.image ?? '/images/placeholder-food.jpg',
    category: item?.category ?? 'Uncategorized',
    tags: Array.isArray(item?.tags) ? item.tags : [],
    available: Boolean(item?.isAvailable ?? item?.available ?? true),
    prep_time: Number(item?.preparationTime ?? item?.prep_time ?? 15),
    isVegetarian: Boolean(item?.isVegetarian ?? false),
    isVegan: Boolean(item?.isVegan ?? false),
    isGlutenFree: Boolean(item?.isGlutenFree ?? false),
    isDairyFree: Boolean(item?.isDairyFree ?? false),
    isPopular: Boolean(item?.isPopular ?? false),
    rating: typeof item?.rating === 'number' ? item.rating : 0,
    totalOrders: typeof item?.totalOrders === 'number' ? item.totalOrders : 0,
  };
}

async function seedMenuIfEmpty() {
  const source = Array.isArray(fallbackMenuItems) ? fallbackMenuItems : [];
  if (source.length === 0) return;

  const fallbackIds = source.map((item) => String(item.id));
  const existing = await MenuItem.find({ id: { $in: fallbackIds } }, { id: 1 }).lean();
  const existingIds = new Set(existing.map((doc: any) => String(doc.id)));

  const missingItems = source.filter((item) => !existingIds.has(String(item.id)));

  const seedDocs = missingItems.map((item) => ({
    id: String(item.id),
    name: item.name,
    description: item.description ?? '',
    category: item.category,
    price: Number(item.price ?? 0),
    image: item.image || '/images/placeholder-food.jpg',
    tags: Array.isArray(item.tags) ? item.tags : [],
    isAvailable: item.available !== false,
    preparationTime: Number(item.prep_time ?? 15),
    nutritionInfo: { calories: Number(item.calories ?? 0) },
    isVegetarian: Boolean(item.isVegetarian ?? item.tags?.includes('Vegetarian')),
    isVegan: Boolean(item.isVegan ?? item.tags?.includes('Vegan')),
    isGlutenFree: Boolean(item.isGlutenFree ?? item.tags?.includes('Gluten Free')),
    isDairyFree: Boolean(item.isDairyFree ?? false),
    isPopular: Boolean(item.isPopular ?? item.tags?.includes('Popular')),
    rating: typeof item.rating === 'number' ? item.rating : 0,
    totalOrders: 0,
  }));

  if (seedDocs.length === 0) return;

  await MenuItem.insertMany(seedDocs, { ordered: false });
  logger.info(`Auto-seeded ${seedDocs.length} missing menu items`);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Math.min(Number(url.searchParams.get('limit') || '100'), 200);
    const category = url.searchParams.get('category');
    const adminView = url.searchParams.get('adminView') === 'true';

    const cacheKey = `menu:all:${page}:${limit}:${category || 'all'}:${adminView ? 'admin' : 'user'}`;
    
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return successResponse({
        ...(cachedData as Record<string, unknown>),
        cached: true
      });
    }

    await connectDB();
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (!adminView) {
      query.isAvailable = true;
    }

    if (category && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    let [items, total] = await Promise.all([
      MenuItem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MenuItem.countDocuments(query)
    ]);

    if (total === 0) {
      await seedMenuIfEmpty();
      [items, total] = await Promise.all([
        MenuItem.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        MenuItem.countDocuments(query)
      ]);
    } else if (adminView) {
      // Keep fallback catalog in sync if DB is partially populated.
      await seedMenuIfEmpty();
      [items, total] = await Promise.all([
        MenuItem.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        MenuItem.countDocuments(query)
      ]);
    }

    const clientItems = (Array.isArray(items) ? items : []).map(toClientMenuItem);

    const responseData = {
      data: clientItems,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };

    cache.set(cacheKey, responseData, 60);

    return successResponse({
      ...responseData,
      cached: false
    });
  } catch (err) {
    logger.error('Failed to fetch menu items', err);
    return errorResponse('Failed to fetch menu items', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; email?: string } | undefined;
    if (!session || !user || (user.role !== 'admin' && user.role !== 'canteen_staff')) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));

    // Simple validation
    const required = ['name', 'price', 'category'];
    const missing = required.filter(k => !body[k]);
    if (missing.length) {
      return errorResponse(`Missing fields: ${missing.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    const exists = await MenuItem.findOne({ name: body.name });
    if (exists) {
      return errorResponse('Menu item already exists', 409, 'ALREADY_EXISTS');
    }

    const item = new MenuItem({
      ...body,
      id: body.id || `MENU-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      isAvailable: body.isAvailable ?? body.available ?? true,
      preparationTime: body.preparationTime ?? body.prep_time ?? 15,
      nutritionInfo: body.nutritionInfo ?? { calories: body.calories ?? 0 },
    });

    const saved = await item.save();
    
    logger.info(`Menu Item Created: ${saved.name}`, { admin: session.user.email });
    cache.clearPattern('menu:');
    
    const clientItem = toClientMenuItem(saved);
    try {
      await pusherServer.trigger('broadcast', 'menu:created', clientItem);
    } catch (e) {
      logger.warn('Failed to broadcast menu:created', e);
    }

    return successResponse(clientItem, 201);
  } catch (err) {
    logger.error('Failed to create menu item', err);
    return errorResponse('Failed to create menu item', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; email?: string } | undefined;
    if (!session || !user || (user.role !== 'admin' && user.role !== 'canteen_staff')) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const id = body._id || body.id;

    if (!id) return errorResponse('ID required', 400, 'INVALID_INPUT');

    const updatePayload: Record<string, unknown> = { ...body };
    if ('available' in body && !('isAvailable' in body)) updatePayload.isAvailable = body.available;
    if ('prep_time' in body && !('preparationTime' in body)) updatePayload.preparationTime = body.prep_time;
    if ('calories' in body && !('nutritionInfo' in body)) updatePayload.nutritionInfo = { calories: body.calories };

    const updated = await MenuItem.findByIdAndUpdate(id, { $set: updatePayload }, { new: true }).lean();
    if (!updated) return errorResponse('Menu item not found', 404, 'NOT_FOUND');

    logger.info(`Menu Item Updated: ${updated.name}`, { admin: session.user.email });
    cache.clearPattern('menu:');

    const clientItem = toClientMenuItem(updated);
    try {
      await pusherServer.trigger('broadcast', 'menu:updated', clientItem);
    } catch (e) {
      logger.warn('Failed to broadcast menu:updated', e);
    }

    return successResponse(clientItem);
  } catch (err) {
    logger.error('Failed to update menu item', err);
    return errorResponse('Failed to update menu item', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; email?: string } | undefined;
    if (!session || !user || (user.role !== 'admin' && user.role !== 'canteen_staff')) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    await connectDB();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return errorResponse('ID required', 400, 'INVALID_INPUT');

    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted) return errorResponse('Menu item not found', 404, 'NOT_FOUND');

    logger.info(`Menu Item Deleted: ${id}`, { admin: session.user.email });
    cache.clearPattern('menu:');

    const clientItem = toClientMenuItem(deleted);
    try {
      await pusherServer.trigger('broadcast', 'menu:deleted', clientItem);
    } catch (e) {
      logger.warn('Failed to broadcast menu:deleted', e);
    }

    return successResponse({ message: 'Item deleted successfully' });
  } catch (err) {
    logger.error('Failed to delete menu item', err);
    return errorResponse('Failed to delete menu item', 500);
  }
}
