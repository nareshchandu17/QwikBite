import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/order.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session.user as { role?: string }).role;
        if (!['admin', 'canteen_staff'].includes(userRole as any)) {
            return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
        }

        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');

        const query: any = {};
        if (status) {
            query.status = status;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .populate('user', 'name email phone')
            .lean();

        // Generate CSV
        const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Customer Phone', 'Status', 'Payment Status', 'Total Amount', 'Items', 'Created Date', 'Pickup Date', 'Time Slot'];
        const rows = orders.map((order: any) => {
            const items = order.items.map((item: any) => `${item.name} (${item.quantity}x)`).join('; ');
            return [
                order.orderId,
                order.user?.name || order.username || 'Guest',
                order.user?.email || '',
                order.user?.phone || '',
                order.status,
                order.paymentStatus,
                order.totalAmount,
                items,
                order.createdAt?.toISOString() || '',
                order.pickupDate || '',
                order.timeSlot || '',
            ];
        });

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="orders_export_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (err) {
        console.error('[Orders Export Error]', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to export orders' }, { status: 500 });
    }
}
