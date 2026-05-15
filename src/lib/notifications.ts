import { pusherServer } from './pusher';
import { connectToDatabase } from './db/mongodb';
import { ObjectId } from 'mongodb';

// Notification types
export interface NotificationData {
  id: string;
  userId: string;
  type: 'order' | 'offer' | 'feedback' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high';
  icon: string;
  data?: unknown;
}

// Send promotional offer notification
export async function sendPromotionalOffer(socket: any, userId: string, offerData: {
  title: string;
  description: string;
  discount?: string;
  validUntil?: Date;
}) {
  const notification: NotificationData = {
    id: `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type: 'offer',
    title: `🎉 ${offerData.title}`,
    message: `${offerData.description}${offerData.discount ? ` - Save ${offerData.discount}!` : ''}${offerData.validUntil ? ` - Valid until ${offerData.validUntil.toLocaleDateString()}` : ''}`,
    isRead: false,
    timestamp: new Date(),
    priority: 'normal',
    icon: 'tag',
    data: { type: 'promotional-offer', ...offerData }
  };

  const channel = `user-${userId}`;
  await pusherServer.trigger(channel, 'new_notification', notification);
  console.log('[Notifications] Sent promotional offer:', notification);
}

// Send system maintenance notification
export async function sendSystemMaintenance(socket: any, userId: string, maintenanceData: {
  title: string;
  message: string;
  scheduledTime?: Date;
  duration?: string;
}) {
  const notification: NotificationData = {
    id: `maintenance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type: 'system',
    title: `🔧 ${maintenanceData.title}`,
    message: `${maintenanceData.message}${maintenanceData.scheduledTime ? ` - Scheduled for ${maintenanceData.scheduledTime.toLocaleString()}` : ''}${maintenanceData.duration ? ` - Duration: ${maintenanceData.duration}` : ''}`,
    isRead: false,
    timestamp: new Date(),
    priority: 'high',
    icon: 'alert-circle',
    data: { type: 'system-maintenance', ...maintenanceData }
  };

  const channel = `user-${userId}`;
  await pusherServer.trigger(channel, 'new_notification', notification);
  console.log('[Notifications] Sent system maintenance:', notification);
}

// Send delivery update notification
export async function sendDeliveryUpdate(socket: any, userId: string, deliveryData: {
  orderId: string;
  status: 'out-for-delivery' | 'arriving-soon' | 'delivered';
  estimatedTime?: Date;
  deliveryPerson?: string;
}) {
  const statusMessages = {
    'out-for-delivery': 'Your order is on the way!',
    'arriving-soon': 'Your order will arrive soon!',
    'delivered': 'Your order has been delivered!'
  };

  const notification: NotificationData = {
    id: `delivery-${deliveryData.orderId}-${Date.now()}`,
    userId,
    type: 'order',
    title: `🚚 Delivery Update`,
    message: `${statusMessages[deliveryData.status]}${deliveryData.estimatedTime ? ` - ETA: ${deliveryData.estimatedTime.toLocaleTimeString()}` : ''}${deliveryData.deliveryPerson ? ` - Driver: ${deliveryData.deliveryPerson}` : ''}`,
    isRead: false,
    timestamp: new Date(),
    priority: deliveryData.status === 'delivered' ? 'high' : 'normal',
    icon: 'truck',
    data: { type: 'delivery-update', ...deliveryData }
  };

  const channel = `user-${userId}`;
  await pusherServer.trigger(channel, 'new_notification', notification);
  console.log('[Notifications] Sent delivery update:', notification);
}

// Send time slot reminder notification
export async function sendTimeSlotReminder(socket: any, userId: string, reminderData: {
  orderId: string;
  timeSlot: string;
  reminderType: '30-min' | '15-min' | '5-min';
}) {
  const reminderMessages = {
    '30-min': 'Your pickup time is in 30 minutes',
    '15-min': 'Your pickup time is in 15 minutes',
    '5-min': 'Your pickup time is in 5 minutes'
  };

  const notification: NotificationData = {
    id: `reminder-${reminderData.orderId}-${Date.now()}`,
    userId,
    type: 'system',
    title: `⏰ Time Slot Reminder`,
    message: `${reminderMessages[reminderData.reminderType]} - ${reminderData.timeSlot}`,
    isRead: false,
    timestamp: new Date(),
    priority: reminderData.reminderType === '5-min' ? 'high' : 'normal',
    icon: 'clock',
    data: { type: 'time-slot-reminder', ...reminderData }
  };

  const channel = `user-${userId}`;
  await pusherServer.trigger(channel, 'new_notification', notification);
  console.log('[Notifications] Sent time slot reminder:', notification);
}

// Broadcast promotional offer to all users
export async function broadcastPromotionalOffer(socket: any, offerData: {
  title: string;
  description: string;
  discount?: string;
  validUntil?: Date;
}) {
  const notification: NotificationData = {
    id: `broadcast-offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: 'broadcast',
    type: 'offer',
    title: `🔥 ${offerData.title}`,
    message: `${offerData.description}${offerData.discount ? ` - Save ${offerData.discount}!` : ''}${offerData.validUntil ? ` - Valid until ${offerData.validUntil.toLocaleDateString()}` : ''}`,
    isRead: false,
    timestamp: new Date(),
    priority: 'high',
    icon: 'tag',
    data: { type: 'broadcast-offer', ...offerData }
  };

  await pusherServer.trigger('broadcast', 'broadcast_notification', notification);
  console.log('[Notifications] Broadcasted promotional offer:', notification);
}

// This would be called when order status changes
export async function sendOrderStatusUpdate(userId: string, orderId: string, status: string) {
  const { db } = await connectToDatabase();
  
  // Get user's push subscription
  const subscription = await db.collection('pushSubscriptions').findOne({ userId });
  
  if (!subscription) return;
  
  // Get order details
  const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
  
  if (!order) return;
  
  const statusMessages: Record<string, string> = {
    'PENDING': 'Your order has been received and is being processed',
    'PREPARING': 'Your order is being prepared',
    'READY_FOR_PICKUP': 'Your order is ready for pickup!',
    'COMPLETED': 'Order completed. Enjoy your meal!',
    'CANCELLED': 'Your order has been cancelled'
  };
  
  const message = statusMessages[status] || 'Your order status has been updated';
  
  // In a real app, you would send this to your push service
  // For example, using a service like OneSignal or Firebase Cloud Messaging
  console.log('Sending push notification:', {
    to: subscription.subscription,
    title: 'Order Update',
    body: message,
    data: { orderId, status }
  });
  
  // In a real implementation, you would call your push service here
  // await fetch('https://your-push-service.com/send', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     subscription: subscription.subscription,
  //     message: {
  //       title: 'Order Update',
  //       body: message,
  //       data: { orderId, status }
  //     }
  //   })
  // });
}

// This would be called from the client to request notification permission
// and subscribe the user
// This is a client-side function
export async function requestNotificationPermission() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permission not granted for notifications');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    });

    return subscription;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}
