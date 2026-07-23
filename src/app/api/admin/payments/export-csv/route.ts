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

// GET /api/admin/payments/export-csv - Export payments as CSV
export async function GET(req: NextRequest) {
    try {
        const authResult = await checkAuth(req);
        if (!authResult.authorized) {
            return jsonResponse({ error: authResult.error }, authResult.status);
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const query: any = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        const payments = await Payment.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Generate CSV
        const headers = ['Transaction ID', 'Order ID', 'Customer Name', 'Customer Email', 'Customer Phone', 'Amount', 'Currency', 'Method', 'Status', 'Date', 'Refund Amount', 'Refund Reason'];
        const rows = payments.map((payment: any) => [
            payment.transactionId,
            payment.orderId,
            payment.customerName,
            payment.customerEmail || '',
            payment.customerPhone || '',
            payment.amount,
            payment.currency,
            payment.method,
            payment.status,
            payment.createdAt?.toISOString() || '',
            payment.refundAmount || '',
            payment.refundReason || '',
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="payments_export_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (err) {
        console.error('[Payments Export Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to export payments' }, 500);
    }
}
