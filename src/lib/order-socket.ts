import { pusherServer } from './pusher';

// WebSocket Events
export const ORDER_EVENTS = {
  ORDER_UPDATED: 'order:updated',
  ORDER_CREATED: 'order:created',
  ORDER_CANCELLED: 'order:cancelled',
  ORDER_READY: 'order:ready',
  ORDER_DELIVERED: 'order:delivered'
} as const;

// Order Status Messages
export const ORDER_STATUS_MESSAGES = {
  pending: 'Order received 📝',
  received: 'Order confirmed ✅',
  preparing: 'Preparing your food 🍳',
  ready: 'Ready for pickup 🎉',
  out_for_delivery: 'On the way 🚚',
  delivered: 'Delivered successfully 🎊',
  cancelled: 'Order cancelled ❌'
} as const;

// Emit order update event using Pusher
export const emitOrderUpdate = async (
  io: any, // kept for backward compatibility with calling code, not used
  orderId: string,
  status: string,
  userId?: string,
  additionalData?: Record<string, unknown>
) => {
  const message = ORDER_STATUS_MESSAGES[status as keyof typeof ORDER_STATUS_MESSAGES] || 'Order updated';
  
  const eventData = {
    orderId,
    status,
    message,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  try {
    // Note: Pusher channel names cannot contain colons in some contexts, using hyphen instead
    const sanitizedOrderId = orderId.replace(/:/g, '-');
    const orderChannel = `order-${sanitizedOrderId}`;
    
    // Emit to order-specific room
    await pusherServer.trigger(orderChannel, ORDER_EVENTS.ORDER_UPDATED, eventData);
    
    // Emit to user-specific room if userId is provided
    if (userId) {
      const userChannel = `user-${userId.toString().replace(/:/g, '-')}`;
      await pusherServer.trigger(userChannel, ORDER_EVENTS.ORDER_UPDATED, eventData);
    }
    
    // Emit to general room for admin/staff
    await pusherServer.trigger('admin', ORDER_EVENTS.ORDER_UPDATED, eventData);
    
    console.log(`[Pusher] Emitted order update to ${orderChannel}:`, eventData);
  } catch (error) {
    console.error(`[Pusher] Failed to emit order update:`, error);
  }
};
