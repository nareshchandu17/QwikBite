import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { MenuItem } from '@/models/menuItem.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cache } from '@/lib/cache';
import { successResponse, errorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';

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

    const [items, total] = await Promise.all([
      MenuItem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MenuItem.countDocuments(query)
    ]);

    const responseData = {
      data: items,
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
      isAvailable: body.isAvailable ?? true,
      preparationTime: body.preparationTime ?? 15,
    });

    const saved = await item.save();
    
    logger.info(`Menu Item Created: ${saved.name}`, { admin: session.user.email });
    cache.clearPattern('menu:');
    
    return successResponse(saved, 201);
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
    
    const updated = await MenuItem.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
    if (!updated) return errorResponse('Menu item not found', 404, 'NOT_FOUND');

    logger.info(`Menu Item Updated: ${updated.name}`, { admin: session.user.email });
    cache.clearPattern('menu:');

    return successResponse(updated);
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

    return successResponse({ message: 'Item deleted successfully' });
  } catch (err) {
    logger.error('Failed to delete menu item', err);
    return errorResponse('Failed to delete menu item', 500);
  }
}
