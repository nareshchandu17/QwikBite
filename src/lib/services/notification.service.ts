/**
 * Notification Service
 * Handles creating and sending notifications to admin and customers
 */

import { socketManager } from '@/lib/websocket/server';
import { connectDB } from '@/lib/db';
import { Notification } from '@/lib/models/Notification';
import mongoose from 'mongoose';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'menu' | 'feedback' | 'system' | 'alert';
  priority?: 'low' | 'normal' | 'high';
  icon?: string;
  ctaLink?: string;
  data?: unknown;
}

export class NotificationService {
  /**
   * Send notification to customer
   * - Saves to database
   * - Emits WebSocket event for real-time delivery
   */
  static async notifyCustomer(payload: NotificationPayload) {
    try {
      await connectDB();
      
      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
        console.error('[NotificationService] Invalid userId:', payload.userId);
        return null;
      }

      // Create notification in database
      const notification = await Notification.create({
        userId: new mongoose.Types.ObjectId(payload.userId),
        title: payload.title,
        message: payload.message,
        type: payload.type,
        priority: payload.priority || 'normal',
        icon: payload.icon,
        ctaLink: payload.ctaLink,
        data: payload.data,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`[NotificationService] ✅ Notification created for customer ${payload.userId}`);

      // Emit WebSocket event for real-time delivery
      try {
        await socketManager.emitToUser(
          payload.userId,
          'new_notification',
          {
            id: notification._id?.toString(),
            userId: notification.userId?.toString(),
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            icon: notification.icon,
            data: notification.data,
            ctaLink: notification.ctaLink,
            isRead: false,
            timestamp: notification.createdAt
          }
        );
        console.log(`[NotificationService] 📡 WebSocket event sent to customer ${payload.userId}`);
      } catch (wsError) {
        console.warn('[NotificationService] ⚠️ WebSocket event failed, notification still saved:', wsError);
      }

      return notification;
    } catch (error) {
      console.error('[NotificationService] ❌ Error notifying customer:', error);
      return null;
    }
  }

  /**
   * Send notification to all customers (broadcast)
   */
  static async notifyAllCustomers(payload: Omit<NotificationPayload, 'userId'>) {
    try {
      await connectDB();

      // Broadcast via WebSocket
      socketManager.emitToAll('new_notification', {
        title: payload.title,
        message: payload.message,
        type: payload.type,
        priority: payload.priority || 'normal',
        icon: payload.icon,
        ctaLink: payload.ctaLink,
        data: payload.data,
        timestamp: new Date()
      });

      console.log('[NotificationService] 📡 Broadcast notification sent to all customers');
      return true;
    } catch (error) {
      console.error('[NotificationService] ❌ Error broadcasting notification:', error);
      return false;
    }
  }

  /**
   * Send notification to admin
   */
  static async notifyAdmin(payload: Omit<NotificationPayload, 'userId'> & { adminIds?: string[] }) {
    try {
      const { adminIds, ...notificationData } = payload;

      if (adminIds && adminIds.length > 0) {
        // Send to specific admins
        for (const adminId of adminIds) {
          await socketManager.emitToUser(
            adminId,
            'admin_notification',
            {
              title: notificationData.title,
              message: notificationData.message,
              type: notificationData.type,
              priority: notificationData.priority || 'high',
              icon: notificationData.icon,
              data: notificationData.data,
              timestamp: new Date()
            }
          );
        }
        console.log(`[NotificationService] 📡 Admin notification sent to ${adminIds.length} admins`);
      } else {
        // Broadcast to all connected admins
        socketManager.emitToAll('admin_notification', {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority || 'high',
          icon: notificationData.icon,
          data: notificationData.data,
          timestamp: new Date()
        });
        console.log('[NotificationService] 📡 Admin notification broadcast');
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] ❌ Error notifying admin:', error);
      return false;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      await connectDB();

      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        throw new Error('Invalid notification ID');
      }

      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true, updatedAt: new Date() },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Emit update event
      await socketManager.emitToUser(userId, 'notification_updated', {
        notificationId,
        isRead: true
      });

      return notification;
    } catch (error) {
      console.error('[NotificationService] ❌ Error marking notification as read:', error);
      return null;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    try {
      await connectDB();

      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        throw new Error('Invalid notification ID');
      }

      await Notification.findByIdAndDelete(notificationId);

      // Emit delete event
      await socketManager.emitToUser(userId, 'notification_deleted', {
        notificationId
      });

      return true;
    } catch (error) {
      console.error('[NotificationService] ❌ Error deleting notification:', error);
      return false;
    }
  }
}

export default NotificationService;
