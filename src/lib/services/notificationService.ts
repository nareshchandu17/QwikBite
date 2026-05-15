import connectDB from '../db';
import { Notification } from '../models/Notification';
import { pusherServer } from '@/lib/pusher';
import { User } from '../models/User';
import mongoose from 'mongoose';

export class NotificationService {
  /**
   * Send a notification to a specific user
   */
  static async sendNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: 'order_update' | 'promo' | 'system' | 'payment' | 'offer' | 'feedback';
    priority?: 'low' | 'medium' | 'high';
    deepLink?: string;
    data?: any;
  }) {
    try {
      await connectDB();

      // 1. Save to Database
      const notification = await Notification.create({
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        priority: params.priority || 'medium',
        deepLink: params.deepLink,
        data: params.data,
        isRead: false
      });

      console.log(`[NotificationService] Saved to DB: ${notification.notificationId} for user ${params.userId}`);

      // 2. Emit via Pusher
      // We emit both a specific event and a general 'new_notification'
      const channel = `user-${params.userId}`;
      await pusherServer.trigger(channel, 'new_notification', notification);
      
      return notification;
    } catch (error) {
      console.error('[NotificationService] Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Notify all admins about a new order
   */
  static async notifyAdminsNewOrder(order: any) {
    try {
      await connectDB();
      // Use role 'admin' or 'staff'
      const admins = await User.find({ role: { $in: ['admin', 'staff', 'canteen_staff'] } }).select('_id');

      const notifications = await Promise.all(admins.map(admin => 
        this.sendNotification({
          userId: admin._id.toString(),
          title: 'New Order Received!',
          message: `Order ${order.orderId} has been placed for ${order.totalAmount} INR.`,
          type: 'order_update',
          priority: 'high',
          deepLink: `/admincanteen/orders`,
          data: { orderId: order.orderId }
        })
      ));

      // Also emit a general admin event for the dashboard counters
      await pusherServer.trigger('admin', 'admin:new_order', order);
      
      return notifications;
    } catch (error) {
      console.error('[NotificationService] Error notifying admins:', error);
    }
  }

  /**
   * Notify customer about order status change
   */
  static async notifyOrderStatusChange(order: any) {
    try {
      const statusMessages: Record<string, string> = {
        'confirmed': 'Your order has been confirmed!',
        'preparing': 'Chef is preparing your delicious meal!',
        'ready': 'Your order is ready for pickup!',
        'completed': 'Hope you enjoyed your meal! Order completed.',
        'cancelled': 'Your order has been cancelled.'
      };

      const message = statusMessages[order.status] || `Your order status is now: ${order.status}`;

      return await this.sendNotification({
        userId: order.user.toString(),
        title: 'Order Update',
        message: message,
        type: 'order_update',
        priority: 'medium',
        deepLink: `/customer/orders/${order.orderId}`,
        data: { orderId: order.orderId, status: order.status }
      });
    } catch (error) {
      console.error('[NotificationService] Error notifying customer:', error);
    }
  }
}
