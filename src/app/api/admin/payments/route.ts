import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payment, { PaymentStatus, PaymentMethod } from '@/lib/models/Payment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';
import { sanitizeString, sanitizeObject } from '@/lib/security/sanitizer';
import { pusherServer } from '@/lib/pusher';

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

// GET /api/admin/payments - Fetch all transactions with pagination and filtering
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
        const status = searchParams.get('status');
        const method = searchParams.get('method');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build query
        const query: any = {};
        if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
            query.status = status;
        }
        if (method && Object.values(PaymentMethod).includes(method as PaymentMethod)) {
            query.method = method;
        }
        if (search) {
            query.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { orderId: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
            ];
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

        const [payments, total] = await Promise.all([
            Payment.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean(),
            Payment.countDocuments(query)
        ]);

        // Transform payments to match frontend Transaction type
        const transactions = payments.map((payment: any) => ({
            id: payment._id?.toString() || '',
            transactionId: payment.transactionId,
            orderId: payment.orderId,
            customer: payment.customerName,
            amount: payment.amount,
            method: payment.method,
            status: payment.status,
            date: payment.createdAt,
            customerEmail: payment.customerEmail,
            customerPhone: payment.customerPhone,
            items: payment.items,
            refundAmount: payment.refundAmount,
            refundReason: payment.refundReason,
        }));

        return jsonResponse({ 
            success: true, 
            data: transactions,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                hasMore: skip + limit < total
            }
        });
    } catch (err) {
        console.error('[Payments GET Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to fetch payments' }, 500);
    }
}

// POST /api/admin/payments - Process refund
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

        const { transactionId, refundAmount, refundReason } = sanitizedBody;

        if (!transactionId) {
            return jsonResponse({ error: 'Transaction ID is required' }, 400);
        }

        if (!refundAmount || refundAmount <= 0) {
            return jsonResponse({ error: 'Valid refund amount is required' }, 400);
        }

        if (!refundReason) {
            return jsonResponse({ error: 'Refund reason is required' }, 400);
        }

        // Find payment
        const payment = await Payment.findOne({ transactionId });
        if (!payment) {
            return jsonResponse({ error: 'Transaction not found' }, 404);
        }

        if (payment.status === PaymentStatus.REFUNDED) {
            return jsonResponse({ error: 'Transaction already refunded' }, 400);
        }

        if (payment.status !== PaymentStatus.COMPLETED) {
            return jsonResponse({ error: 'Only completed transactions can be refunded' }, 400);
        }

        if (refundAmount > payment.amount) {
            return jsonResponse({ error: 'Refund amount cannot exceed original payment amount' }, 400);
        }

        // Update payment with refund details
        payment.status = PaymentStatus.REFUNDED;
        payment.refundAmount = Number(refundAmount);
        payment.refundReason = sanitizeString(refundReason);
        payment.refundedAt = new Date();
        await payment.save();

        // Emit real-time notification
        try {
            await pusherServer.trigger('admin', 'payment_update', {
                type: 'payment_refunded',
                payment: payment.toObject(),
                timestamp: new Date()
            });
        } catch (pusherError) {
            console.error('Failed to send Pusher notification:', pusherError);
        }

        return jsonResponse({ 
            success: true, 
            data: payment.toObject(),
            message: 'Refund processed successfully'
        });
    } catch (err) {
        console.error('[Payments POST Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to process refund' }, 500);
    }
}

// PUT /api/admin/payments - Update transaction status
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

        const { transactionId, status } = sanitizedBody;

        if (!transactionId) {
            return jsonResponse({ error: 'Transaction ID is required' }, 400);
        }

        if (!status || !Object.values(PaymentStatus).includes(status as PaymentStatus)) {
            return jsonResponse({ error: `Valid status is required (${Object.values(PaymentStatus).join(', ')})` }, 400);
        }

        // Find and update payment
        const payment = await Payment.findOneAndUpdate(
            { transactionId },
            { status },
            { new: true, runValidators: true }
        );

        if (!payment) {
            return jsonResponse({ error: 'Transaction not found' }, 404);
        }

     
        // Emit real-time notification
        try {
            await pusherServer.trigger('admin', 'payment_update', {
                type: 'payment_status_updated',
                payment: payment.toObject(),
                timestamp: new Date()
            });
        } catch (pusherError) {
            console.error('Failed to send Pusher notification:', pusherError);
        }

        return jsonResponse({ success: true, data: payment.toObject() });
    } catch (err) {
        console.error('[Payments PUT Error]', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to update payment status' }, 500);
    }
}
