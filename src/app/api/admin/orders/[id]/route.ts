import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/order.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';

const jsonResponse = (data: unknown, status = 200) => {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const userRole = (session.user as { role?: string }).role;
        if (!['admin', 'canteen_staff'].includes(userRole as any)) {
            return jsonResponse({ error: 'Forbidden - Insufficient permissions' }, 403);
        }

        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();

        const order = await Order.findOne({
            $or: [
                { orderId: params.id },
                ...(mongoose.Types.ObjectId.isValid(params.id) ? [{ _id: params.id }] : [])
            ]
        })
            .populate('user', 'name email phone')
            .populate('slot')
            .lean();

        if (!order) {
            return jsonResponse({ error: 'Order not found' }, 404);
        }

        const mappedOrder = {
            ...order,
            id: order.orderId || order._id.toString(),
            total: order.totalAmount || order.total || 0,
            customerName: (order.user as any)?.name || order.username || 'Guest',
            customerEmail: (order.user as any)?.email,
            customerPhone: (order.user as any)?.phone,
        };

        return jsonResponse({ data: mappedOrder });
    } catch (err) {
        console.error('[Order Details Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to fetch order details' }, 500);
    }
}
