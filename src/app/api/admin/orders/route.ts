import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, OrderStatus } from '@/models/order.model';
import '@/models/menuItem.model';
import '@/models/user.model';
import { syncTimeSlotUsage } from '@/lib/slot-utils';
import { pusherServer } from '@/lib/pusher';
import { AuditService } from '@/lib/services/auditService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';
import { sanitizeString, sanitizeObject } from '@/lib/security/sanitizer';

const jsonResponse = (data: unknown, status = 200) => {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

// Valid status transitions
const validStatusTransitions: Record<string, string[]> = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': [],
};

export async function GET(req: NextRequest) {
    try {
        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        // Authorization check - only admin and canteen staff can access
        const userRole = (session.user as { role?: string }).role;
        if (!['admin', 'canteen_staff'].includes(userRole as any)) {
            return jsonResponse({ error: 'Forbidden - Insufficient permissions' }, 403);
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || '-1';

        // Build query
        const query: any = {};
        if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
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

        // Build sort object
        const sort: any = {};
        sort[sortBy] = parseInt(sortOrder);

        // Fetch orders with pagination
        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort(sort)
                .limit(limit)
                .skip(skip)
                .populate('user', 'name email phone')
                .populate('slot')
                .lean(),
            Order.countDocuments(query)
        ]);

        // Map MongoDB _id and orderId to the 'id' field expected by the frontend
        const mappedOrders = orders.map((order: any) => ({
            ...order,
            id: order.orderId || order._id.toString(),
            total: order.totalAmount || order.total || 0,
            customerName: order.user?.name || order.username || 'Guest',
            customerEmail: order.user?.email,
            customerPhone: order.user?.phone,
            pickupTime: order.pickupTime,
            pickupDate: order.pickupDate,
            timeSlot: order.timeSlot,
            estimatedReadyTime: order.estimatedReadyTime,
        }));

        return jsonResponse({ 
            data: mappedOrders,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                hasMore: skip + limit < total
            }
        });
    } catch (err) {
        console.error('Admin Orders GET Error:', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to fetch orders' }, 500);
    }
}

export async function PATCH(req: NextRequest) {
    try {
        // Authentication check
        const authSession = await getServerSession(authOptions);
        if (!authSession?.user) {
            return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        // Authorization check
        const userRole = (authSession.user as { role?: string }).role;
        if (!['admin', 'canteen_staff'].includes(userRole as any)) {
            return jsonResponse({ error: 'Forbidden - Insufficient permissions' }, 403);
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
        const { id, status, note } = sanitizedBody;

        if (!id || !status) {
            return jsonResponse({ error: 'Order ID and status are required' }, 400);
        }

        // Use findOne with $or to handle both orderId and _id
        const order = await Order.findOne({
            $or: [
                { orderId: id },
                ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
            ]
        });

        if (!order) {
            return jsonResponse({ error: 'Order not found' }, 404);
        }

        // Validate status transition
        const currentStatus = order.status;
        const allowedTransitions = validStatusTransitions[currentStatus] || [];
        if (!allowedTransitions.includes(status)) {
            return jsonResponse({ 
                error: `Invalid status transition from ${currentStatus} to ${status}. Allowed transitions: ${allowedTransitions.join(', ')}` 
            }, 400);
        }

        // Update status - this triggers the pre-save hook for statusHistory
        order.status = status as OrderStatus;
        if (note) {
            order.statusHistory[order.statusHistory.length - 1].note = sanitizeString(note);
        }
        await order.save();

        await syncTimeSlotUsage();

        // 🚀 REAL-TIME: Emit update to specific order room and admin dashboard
        const orderChannel = `order-${order._id.toString().replace(/:/g, '-')}`;
        await pusherServer.trigger(orderChannel, 'order:update', {
            status: order.status,
            orderId: order.orderId,
            updatedOrder: order
        });
        await pusherServer.trigger('admin', 'admin:order_updated', order);

        // Log the action (Audit Trail)
        if (authSession) {
            await AuditService.log({
                action: 'UPDATE',
                entityType: 'ORDER',
                entityId: order.orderId,
                entityName: `Order ${order.orderId}`,
                userId: authSession.user.id,
                userEmail: authSession.user.email!,
                userRole: authSession.user.role,
                changes: { status },
                description: `Order ${order.orderId} status updated to ${status}${note ? `: ${note}` : ''}`,
                severity: 'LOW',
                ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
            });
        }

        return jsonResponse({ data: order });

    } catch (err) {
        console.error('[Admin Orders PATCH Error]', err);
        return jsonResponse({ error: (err as Error).message }, 500);
    }
}

export async function PUT(req: NextRequest) {
    try {
        const authSession = await getServerSession(authOptions);
        if (!authSession?.user) {
            return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const userRole = (authSession.user as { role?: string }).role;
        if (!['admin', 'canteen_staff'].includes(userRole as any)) {
            return jsonResponse({ error: 'Forbidden - Insufficient permissions' }, 403);
        }

        const identifier = getRateLimitIdentifier(req as Request);
        const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
        if (!rateLimitResult.allowed) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        await connectDB();
        const body = await req.json();
        const sanitizedBody = sanitizeObject(body);
        const { id, note } = sanitizedBody;

        if (!id || !note) {
            return jsonResponse({ error: 'Order ID and note are required' }, 400);
        }

        const order = await Order.findOne({
            $or: [
                { orderId: id },
                ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
            ]
        });

        if (!order) {
            return jsonResponse({ error: 'Order not found' }, 404);
        }

        order.statusHistory.push({
            status: order.status,
            timestamp: new Date(),
            note: sanitizeString(note),
            updatedBy: authSession.user.id as any,
        });

        await order.save();

        await pusherServer.trigger('admin', 'admin:order_updated', order);

        return jsonResponse({ data: order });

    } catch (err) {
        console.error('[Admin Orders PUT Error]', err);
        return jsonResponse({ error: (err as Error).message }, 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        // Authentication check
        const authSession = await getServerSession(authOptions);
        if (!authSession?.user) {
            return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        // Authorization check
        const userRole = (authSession.user as { role?: string }).role;
        if (!['admin', 'canteen_staff'].includes(userRole as any)) {
            return jsonResponse({ error: 'Forbidden - Insufficient permissions' }, 403);
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

        // Check if this is a bulk update
        if (sanitizedBody.bulk && Array.isArray(sanitizedBody.orderIds) && sanitizedBody.status) {
            const { orderIds, status, note } = sanitizedBody;
            
            if (!orderIds.length || !status) {
                return jsonResponse({ error: 'Order IDs and status are required for bulk update' }, 400);
            }

            const results = [];
            const errors = [];

            for (const id of orderIds) {
                try {
                    const order = await Order.findOne({
                        $or: [
                            { orderId: id },
                            ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
                        ]
                    });

                    if (!order) {
                        errors.push({ id, error: 'Order not found' });
                        continue;
                    }

                    // Validate status transition
                    const currentStatus = order.status;
                    const allowedTransitions = validStatusTransitions[currentStatus] || [];
                    if (!allowedTransitions.includes(status)) {
                        errors.push({ id, error: `Invalid status transition from ${currentStatus} to ${status}` });
                        continue;
                    }

                    order.status = status as OrderStatus;
                    if (note) {
                        order.statusHistory[order.statusHistory.length - 1].note = sanitizeString(note);
                    }
                    await order.save();

                    // Emit real-time update
                    const orderChannel = `order-${order._id.toString().replace(/:/g, '-')}`;
                    await pusherServer.trigger(orderChannel, 'order:update', {
                        status: order.status,
                        orderId: order.orderId,
                        updatedOrder: order
                    });

                    results.push({ id, success: true, orderId: order.orderId });
                } catch (err) {
                    errors.push({ id, error: (err as Error).message });
                }
            }

            await syncTimeSlotUsage();
            await pusherServer.trigger('admin', 'admin:order_updated', { bulk: true, status });

            return jsonResponse({ 
                success: true, 
                results, 
                errors,
                total: orderIds.length,
                successCount: results.length,
                errorCount: errors.length
            });
        }

        // Basic creation for admin testing/manual entry
        const order = await Order.create({
            ...sanitizedBody,
            user: sanitizedBody.user || sanitizedBody.userId,
            totalAmount: sanitizedBody.totalAmount || sanitizedBody.total || 0,
        });

        await syncTimeSlotUsage();
        await pusherServer.trigger('admin', 'admin:new_order', order);

        return jsonResponse(order, 201);

    } catch (err) {
        console.error('[Admin Orders POST Error]', err);
        return jsonResponse({ error: (err as Error).message }, 500);
    }
}
