import { EnrichedContext, PageContext, UserState, LiveData, PageType } from './types';
import { connectDB } from '@/lib/db';
import { MenuItem } from '@/models/menuItem.model';
import { Order } from '@/models/order.model';
import { aggregateTimeSlots } from '@/lib/slot-utils';
import { menuItems as staticMenuItems } from '@/data/menu';

/**
 * Build enriched context by fetching live data based on current page
 */
export async function buildEnrichedContext(
    pageContext: PageContext,
    userState: UserState
): Promise<EnrichedContext> {
    await connectDB();

    const liveData: LiveData = {
        currentTime: new Date()
    };

    // Fetch data based on current page
    switch (pageContext.currentPage) {
        case 'menu':
            liveData.menuItems = await fetchMenuItems();
            liveData.availableSlots = await fetchAvailableSlots(2); // Next 2 hours
            liveData.queueLoad = await fetchQueueLoad();
            break;

        case 'order-summary':
            liveData.availableSlots = await fetchAvailableSlots(2);
            // Cart is already in userState
            if (userState.cartItems && userState.cartItems.length > 0) {
                liveData.queueLoad = await fetchQueueLoad();
            }
            break;

        case 'live-status':
            if (userState.activeOrderId) {
                liveData.activeOrder = await fetchActiveOrder(userState.activeOrderId);
            }
            break;

        case 'feedback':
            liveData.recentOrders = await fetchRecentOrders(userState.userId, 5);
            break;

        case 'payment':
            // Payment page doesn't need much live data
            break;

        case 'admin':
            // Admin-specific data would go here
            liveData.queueLoad = await fetchQueueLoad();
            break;
    }

    return {
        pageContext,
        userState,
        liveData,
        timestamp: new Date()
    };
}

/**
 * Fetch available menu items
 */
async function fetchMenuItems() {
    try {
        const items = await MenuItem.find({ availability: true })
            .select('name price preparationTime category dietary availability')
            .lean()
            .limit(200);

        const mapped = items.map((item: unknown) => ({
            id: item._id.toString(),
            name: item.name,
            price: item.price,
            prepTime: item.preparationTime || 15,
            available: item.availability,
            category: item.category || 'Other'
        }));

        // If DB has items, return them
        if (mapped.length > 0) return mapped;
    } catch (error) {
        console.error('[Context Builder] Error fetching menu items, using static fallback:', error);
    }

    // Fallback to bundled static menu for reliable menu awareness (production-safe)
    return staticMenuItems
        .filter(item => item.available !== false)
        .map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            prepTime: item.prep_time || 15,
            available: item.available,
            category: item.category || 'Other'
        }));
}

/**
 * Fetch available time slots for next N hours
 */
async function fetchAvailableSlots(hoursAhead: number = 2) {
    try {
        const slots = await aggregateTimeSlots();
        const now = new Date();
        const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

        // Filter slots within time window
        const availableSlots = slots
            .filter(slot => {
                const slotTime = new Date(slot.timeSlot);
                return slotTime > now && slotTime <= cutoff;
            })
            .map(slot => ({
                id: slot.timeSlot,
                time: slot.timeSlot,
                capacity: slot.capacity || 50,
                currentLoad: slot.used || 0
            }))
            .slice(0, 10); // Limit to 10 slots

        return availableSlots;
    } catch (error) {
        console.error('[Context Builder] Error fetching slots:', error);
        return [];
    }
}

/**
 * Fetch current queue load across all slots
 */
async function fetchQueueLoad() {
    try {
        const activeOrders = await Order.countDocuments({
            status: { $in: ['pending', 'confirmed', 'preparing'] }
        });

        // Get load by slot (simplified - you may have a better way)
        const ordersBySlot = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['pending', 'confirmed', 'preparing'] }
                }
            },
            {
                $group: {
                    _id: '$pickupTime',
                    count: { $sum: 1 }
                }
            }
        ]);

        const bySlot: Record<string, number> = {};
        ordersBySlot.forEach(item => {
            if (item._id) {
                bySlot[item._id] = item.count;
            }
        });

        return {
            total: activeOrders,
            bySlot
        };
    } catch (error) {
        console.error('[Context Builder] Error fetching queue load:', error);
        return { total: 0, bySlot: {} };
    }
}

/**
 * Fetch active order details
 */
async function fetchActiveOrder(orderId: string) {
    try {
        const order = await Order.findById(orderId)
            .populate('items.menuItem', 'name')
            .lean();

        if (!order) return undefined;

        // Calculate estimated completion time (simplified)
        const estimatedCompletion = new Date(order.createdAt);
        estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + 30); // Default 30 min

        return {
            id: order._id.toString(),
            status: order.status,
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity
            })),
            estimatedCompletion
        };
    } catch (error) {
        console.error('[Context Builder] Error fetching active order:', error);
        return undefined;
    }
}

/**
 * Fetch recent orders for user
 */
async function fetchRecentOrders(userId: string, limit: number = 5) {
    try {
        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('_id createdAt totalAmount items')
            .lean();

        return orders.map(order => ({
            id: order._id.toString(),
            date: order.createdAt,
            total: order.totalAmount,
            items: order.items.map(item => item.name)
        }));
    } catch (error) {
        console.error('[Context Builder] Error fetching recent orders:', error);
        return [];
    }
}

/**
 * Lightweight context for quick operations (no DB calls)
 */
export function buildLightweightContext(
    pageContext: PageContext,
    userState: UserState
): EnrichedContext {
    return {
        pageContext,
        userState,
        liveData: {
            currentTime: new Date()
        },
        timestamp: new Date()
    };
}
