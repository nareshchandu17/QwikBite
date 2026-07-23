import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Inventory from '@/lib/models/Inventory';
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

// GET /api/admin/inventory - Fetch all inventory items
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
        const status = searchParams.get('status');

        // Build query
        const query: any = {};
        if (category) query.category = category;
        if (status) query.status = status;

        const inventoryItems = await Inventory.find(query)
            .sort({ category: 1, name: 1 })
            .lean();

        return jsonResponse({ success: true, data: inventoryItems });
    } catch (err) {
        console.error('[Inventory GET Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to fetch inventory items' }, 500);
    }
}

// POST /api/admin/inventory - Create new inventory item
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
        const requiredFields = ['name', 'category', 'quantity', 'status'];
        for (const field of requiredFields) {
            if (sanitizedBody[field] === undefined || sanitizedBody[field] === null) {
                return jsonResponse({ error: `${field} is required` }, 400);
            }
        }

        // Create inventory item
        const inventoryItem = await Inventory.create({
            name: sanitizeString(sanitizedBody.name),
            category: sanitizeString(sanitizedBody.category),
            quantity: Number(sanitizedBody.quantity),
            unit: sanitizeString(sanitizedBody.unit) || 'pcs',
            status: sanitizedBody.status,
            lastUpdated: new Date()
        });

        return jsonResponse({ success: true, data: inventoryItem }, 201);
    } catch (err) {
        console.error('[Inventory POST Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to create inventory item' }, 500);
    }
}

// PUT /api/admin/inventory - Update inventory item
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

        const { _id, name, category, quantity, unit, status } = sanitizedBody;

        if (!_id) {
            return jsonResponse({ error: 'Inventory item ID is required' }, 400);
        }

        // Find and update
        const inventoryItem = await Inventory.findByIdAndUpdate(
            _id,
            {
                name: name ? sanitizeString(name) : undefined,
                category: category ? sanitizeString(category) : undefined,
                quantity: quantity !== undefined ? Number(quantity) : undefined,
                unit: unit ? sanitizeString(unit) : undefined,
                status: status || undefined,
                lastUpdated: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!inventoryItem) {
            return jsonResponse({ error: 'Inventory item not found' }, 404);
        }

        return jsonResponse({ success: true, data: inventoryItem });
    } catch (err) {
        console.error('[Inventory PUT Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to update inventory item' }, 500);
    }
}

// DELETE /api/admin/inventory - Delete inventory item
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
            return jsonResponse({ error: 'Inventory item ID is required' }, 400);
        }

        const inventoryItem = await Inventory.findByIdAndDelete(id);

        if (!inventoryItem) {
            return jsonResponse({ error: 'Inventory item not found' }, 404);
        }

        return jsonResponse({ success: true, message: 'Inventory item deleted successfully' });
    } catch (err) {
        console.error('[Inventory DELETE Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to delete inventory item' }, 500);
    }
}
