import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, OrderStatus } from '@/models/order.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';

const jsonResponse = (data: unknown, status = 200) => {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

export async function GET(req: NextRequest) {
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
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.LENIENT.limit, RateLimitPresets.LENIENT.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '7');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const [totalOrders, statusCounts, revenue] = await Promise.all([
            Order.countDocuments({ createdAt: { $gte: startDate } }),
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
                { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
            ])
        ]);

        const statusMap: Record<string, number> = {};
        statusCounts.forEach((item: any) => {
            statusMap[item._id] = item.count;
        });

        return jsonResponse({
            success: true,
            statistics: {
                totalOrders,
                pending: statusMap['pending'] || 0,
                confirmed: statusMap['confirmed'] || 0,
                preparing: statusMap['preparing'] || 0,
                ready: statusMap['ready'] || 0,
                completed: statusMap['completed'] || 0,
                cancelled: statusMap['cancelled'] || 0,
                totalRevenue: revenue[0]?.totalRevenue || 0,
                averageOrderValue: totalOrders > 0 ? (revenue[0]?.totalRevenue || 0) / totalOrders : 0
            }
        });
    } catch (err) {
        console.error('[Orders Statistics Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to fetch statistics' }, 500);
    }
}
