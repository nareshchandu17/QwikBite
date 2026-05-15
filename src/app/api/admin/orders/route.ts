import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, OrderStatus } from '@/models/order.model';
import '@/models/menuItem.model';
import '@/models/user.model';
import { syncTimeSlotUsage } from '@/lib/slot-utils';
import { socketManager } from '@/lib/websocket/server';
import { AuditService } from '@/lib/services/auditService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

const jsonResponse = (data: unknown, status = 200) => {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
};

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        // Admin view: fetch all orders, sorted by latest
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('user', 'name email')
            // Removed .populate('items.menuItem') to prevent CastError on legacy string IDs
            .lean();

        // Map MongoDB _id and orderId to the 'id' field expected by the frontend
        const mappedOrders = orders.map((order: any) => ({
            ...order,
            id: order.orderId || order._id.toString(),
            total: order.totalAmount,  // map totalAmount -> total for the frontend
            customerName: order.user?.name || order.username || 'Guest',
        }));

        return jsonResponse({ data: mappedOrders });
    } catch (err) {
        console.error('Admin Orders GET Error:', err);
        return jsonResponse({ error: err instanceof Error ? err.message : 'Failed to fetch orders' }, 500);
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, status, note } = body;

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

        // Update status - this triggers the pre-save hook for statusHistory
        order.status = status as OrderStatus;
        await order.save();
        
        // Removed .populate('items.menuItem') to prevent CastError on legacy string IDs

        await syncTimeSlotUsage();

        // 🚀 REAL-TIME: Emit update to specific order room and admin dashboard
        socketManager.emitToRoom(`order:${order._id}`, 'order:update', {
            status: order.status,
            orderId: order.orderId,
            updatedOrder: order
        });
        socketManager.emitToAll('admin:order_updated', order);

        // Log the action (Audit Trail)
        const session = await getServerSession(authOptions);
        if (session) {
            await AuditService.log({
                action: 'UPDATE',
                entityType: 'ORDER',
                entityId: order.orderId,
                entityName: `Order ${order.orderId}`,
                userId: session.user.id,
                userEmail: session.user.email!,
                userRole: session.user.role,
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

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();

        // Basic creation for admin testing/manual entry
        const order = await Order.create({
            ...body,
            user: body.user || body.userId, // Map both just in case
            totalAmount: body.totalAmount || body.total || 0,
        });

        await syncTimeSlotUsage();
        socketManager.emitToAll('admin:new_order', order);

        return jsonResponse(order, 201);

    } catch (err) {
        console.error('[Admin Orders POST Error]', err);
        return jsonResponse({ error: (err as Error).message }, 500);
    }
}
