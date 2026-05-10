import { OrderStatusResult, EnrichedContext } from '../types';
import { connectDB } from '@/lib/db';
import { Order, OrderStatus } from '@/models/order.model';

/**
 * Get order status with ETA calculation
 */
export async function getOrderStatus(
    params: {
        orderId?: string;
    },
    context: EnrichedContext
): Promise<OrderStatusResult> {
    await connectDB();

    // Use orderId from params or context
    const orderId = params.orderId || context.userState.activeOrderId;

    if (!orderId) {
        throw new Error('No active order found');
    }

    const order = await Order.findById(orderId)
        .populate('items.menuItem', 'name')
        .lean();

    if (!order) {
        throw new Error('Order not found');
    }

    // Verify order belongs to user (security check)
    if (order.user.toString() !== context.userState.userId) {
        throw new Error('Unauthorized access to order');
    }

    // Calculate estimated completion time based on status
    let estimatedCompletion: Date | undefined;
    let queuePosition: number | undefined;

    switch (order.status) {
        case 'pending':
            estimatedCompletion = new Date(order.createdAt);
            estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + 30);
            queuePosition = await getQueuePosition(orderId);
            break;
        case 'confirmed':
            estimatedCompletion = new Date(order.createdAt);
            estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + 25);
            break;
        case 'preparing':
            estimatedCompletion = new Date(order.createdAt);
            estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + 15);
            break;
        case 'ready':
            estimatedCompletion = new Date(); // Ready now
            break;
    }

    return {
        order: {
            id: order._id.toString(),
            status: order.status,
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity
            })),
            totalAmount: order.totalAmount,
            createdAt: order.createdAt
        },
        estimatedCompletion,
        queuePosition,
        message: getStatusMessage(order.status, estimatedCompletion, queuePosition)
    };
}

/**
 * Cancel an order
 */
export async function cancelOrder(
    params: {
        orderId?: string;
        reason?: string;
    },
    context: EnrichedContext
): Promise<{ success: boolean; message: string }> {
    await connectDB();

    const orderId = params.orderId || context.userState.activeOrderId;

    if (!orderId) {
        throw new Error('No active order to cancel');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new Error('Order not found');
    }

    // Verify ownership
    if (order.user.toString() !== context.userState.userId) {
        throw new Error('Unauthorized access to order');
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled'].includes(order.status)) {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    if (order.status === 'ready') {
        throw new Error('Order is already ready for pickup. Please contact staff to cancel.');
    }

    // Update order status
    order.status = OrderStatus.CANCELLED;
    await order.save();

    return {
        success: true,
        message: `Order #${orderId.slice(-6)} has been cancelled`
    };
}

/**
 * Estimate wait time for current order
 */
export async function estimateWaitTime(
    params: {
        orderId?: string;
    },
    context: EnrichedContext
): Promise<{ waitTime: number; message: string }> {
    const statusResult = await getOrderStatus(params, context);

    if (!statusResult.estimatedCompletion) {
        return {
            waitTime: 0,
            message: 'Order is ready for pickup'
        };
    }

    const now = new Date();
    const waitTime = Math.max(0, Math.floor((statusResult.estimatedCompletion.getTime() - now.getTime()) / 60000));

    return {
        waitTime,
        message: `Estimated wait time: ${waitTime} minutes`
    };
}

/**
 * Helper: Get queue position
 */
async function getQueuePosition(orderId: string): Promise<number> {
    const order = await Order.findById(orderId);
    if (!order) return 0;

    // Count orders created before this one with pending/confirmed status
    const position = await Order.countDocuments({
        createdAt: { $lt: order.createdAt },
        status: { $in: ['pending', 'confirmed', 'preparing'] }
    });

    return position + 1;
}

/**
 * Helper: Generate status message
 */
function getStatusMessage(
    status: string,
    estimatedCompletion?: Date,
    queuePosition?: number
): string {
    const statusMessages: Record<string, string> = {
        pending: 'Order received and pending confirmation',
        confirmed: 'Order confirmed and will be prepared soon',
        preparing: 'Your order is being prepared',
        ready: 'Order is ready for pickup!',
        out_for_delivery: 'Order is out for delivery',
        delivered: 'Order has been delivered',
        cancelled: 'Order has been cancelled'
    };

    let message = statusMessages[status] || 'Order status unknown';

    if (estimatedCompletion && status !== 'ready') {
        const now = new Date();
        const minutesLeft = Math.max(0, Math.floor((estimatedCompletion.getTime() - now.getTime()) / 60000));
        message += `. ETA: ${minutesLeft} minutes`;
    }

    if (queuePosition && queuePosition > 1) {
        message += `. Queue position: ${queuePosition}`;
    }

    return message;
}
