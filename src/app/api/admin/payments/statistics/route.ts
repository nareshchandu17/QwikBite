import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payment from '@/lib/models/Payment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

// GET /api/admin/payments/statistics - Get payment statistics
export async function GET(req: NextRequest) {
    try {
        const authResult = await checkAuth(req);
        if (!authResult.authorized) {
            return jsonResponse({ error: authResult.error }, authResult.status);
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '7');

        // Get date range for statistics
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const stats = await Payment.getStatistics({ start: startDate, end: new Date() });
        const dailyRevenue = await Payment.getDailyRevenue(days);

        return jsonResponse({
            success: true,
            statistics: {
                totalRevenue: stats.totalRevenue,
                pendingSettlements: stats.pendingSettlements,
                failedTransactions: stats.failedTransactions,
                totalTransactions: stats.totalTransactions,
                completedTransactions: stats.completedTransactions,
                successRate: stats.totalTransactions > 0 
                    ? ((stats.completedTransactions / stats.totalTransactions) * 100).toFixed(2)
                    : '0',
            },
            dailyRevenue,
        });
    } catch (err) {
        console.error('[Payments Statistics Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to fetch statistics' }, 500);
    }
}
