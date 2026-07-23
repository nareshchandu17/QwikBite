import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { MenuItem } from '@/lib/models/MenuItem';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';
import { sanitizeString, sanitizeObject } from '@/lib/security/sanitizer';

const jsonResponse = (data: unknown, status = 200) => {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

// Helper function to check admin authorization
async function checkAuth(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { authorized: false, error: 'Unauthorized', status: 401 };
    }

    const userRole = (session.user as { role?: string }).role;
    if (!['admin', 'canteen_staff'].includes(userRole as any)) {
        return { authorized: false, error: 'Forbidden - Insufficient permissions', status: 403 };
    }

    return { authorized: true, session };
}

// GET /api/admin/menu - Fetch all menu items
export async function GET(req: NextRequest) {
    try {
        const authResult = await checkAuth(req);
        if (!authResult.authorized) {
            return jsonResponse({ error: authResult.error }, authResult.status);
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.LENIENT.limit, RateLimitPresets.LENIENT.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const available = searchParams.get('available');
        const search = searchParams.get('search');

        // Build query
        const query: any = {};
        if (category) query.category = category;
        if (available !== null) query.available = available === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const menuItems = await MenuItem.find(query)
            .sort({ category: 1, name: 1 })
            .lean();

        return jsonResponse({ success: true, data: menuItems });
    } catch (err) {
        console.error('[Menu GET Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to fetch menu items' }, 500);
    }
}

// POST /api/admin/menu - Create new menu item
export async function POST(req: NextRequest) {
    try {
        const authResult = await checkAuth(req);
        if (!authResult.authorized) {
            return jsonResponse({ error: authResult.error }, authResult.status);
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();
        const body = await req.json();

        // Sanitize inputs
        const sanitizedBody = sanitizeObject(body);

        // Validate required fields
        const requiredFields = ['name', 'description', 'price', 'image', 'category'];
        for (const field of requiredFields) {
            if (!sanitizedBody[field]) {
                return jsonResponse({ error: `${field} is required` }, 400);
            }
        }

        // Generate unique ID
        const id = `MENU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create menu item
        const menuItem = await MenuItem.create({
            ...sanitizedBody,
            id,
            itemId: id,
            availability: sanitizedBody.available !== undefined ? sanitizedBody.available : true,
            rating: sanitizedBody.rating || 0,
            totalOrders: sanitizedBody.totalOrders || 0,
        });

        return jsonResponse({ success: true, data: menuItem }, 201);
    } catch (err) {
        console.error('[Menu POST Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to create menu item' }, 500);
    }
}

// PUT /api/admin/menu - Update menu item
export async function PUT(req: NextRequest) {
    try {
        const authResult = await checkAuth(req);
        if (!authResult.authorized) {
            return jsonResponse({ error: authResult.error }, authResult.status);
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();
        const body = await req.json();

        // Sanitize inputs
        const sanitizedBody = sanitizeObject(body);

        const { id, ...updateData } = sanitizedBody;

        if (!id) {
            return jsonResponse({ error: 'Menu item ID is required' }, 400);
        }

        // Find and update
        const menuItem = await MenuItem.findOneAndUpdate(
            { $or: [{ id }, { itemId: id }] },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!menuItem) {
            return jsonResponse({ error: 'Menu item not found' }, 404);
        }

        return jsonResponse({ success: true, data: menuItem });
    } catch (err) {
        console.error('[Menu PUT Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to update menu item' }, 500);
    }
}

// DELETE /api/admin/menu - Delete menu item
export async function DELETE(req: NextRequest) {
    try {
        const authResult = await checkAuth(req);
        if (!authResult.authorized) {
            return jsonResponse({ error: authResult.error }, authResult.status);
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return jsonResponse({ error: 'Menu item ID is required' }, 400);
        }

        const menuItem = await MenuItem.findOneAndDelete({
            $or: [{ id }, { itemId: id }]
        });

        if (!menuItem) {
            return jsonResponse({ error: 'Menu item not found' }, 404);
        }

        return jsonResponse({ success: true, message: 'Menu item deleted successfully' });
    } catch (err) {
        console.error('[Menu DELETE Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to delete menu item' }, 500);
    }
}
