import logger from "@/lib/logger";
import { pusherServer, getUserChannel, ADMIN_CHANNEL } from "@/lib/pusher";
import { connectDB } from "@/lib/db";
import { Notification, NotificationType, NotificationPriority } from "@/models/notification.model";
import mongoose from "mongoose";
import { User } from "@/models/user.model";

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: "order" | "payment" | "menu" | "offer" | "feedback" | "system" | "alert";
  priority?: "low" | "normal" | "high";
  icon?: string;
  ctaLink?: string;
  data?: unknown;
}

function normalizeType(type: NotificationPayload["type"]) {
  if (type === "order") return NotificationType.ORDER_UPDATE;
  if (type === "payment") return NotificationType.PAYMENT;
  if (type === "feedback") return NotificationType.FEEDBACK;
  if (type === "alert") return NotificationType.ALERT;
  if (type === "menu" || type === "offer") return NotificationType.PROMOTION;
  return NotificationType.SYSTEM;
}

function normalizePriority(priority?: NotificationPayload["priority"]) {
  if (priority === "high") return NotificationPriority.HIGH;
  if (priority === "low") return NotificationPriority.LOW;
  return NotificationPriority.NORMAL;
}

function toClientNotification(notification: any, payload?: Pick<NotificationPayload, "type" | "icon" | "data" | "ctaLink">) {
  return {
    id: String(notification._id),
    userId: String(notification.user),
    title: notification.title,
    message: notification.message,
    type: payload?.type || (notification.type === NotificationType.ORDER_UPDATE ? "order" : String(notification.type)),
    priority: notification.priority,
    icon: notification.icon || payload?.icon || "🔔",
    data: notification.metadata || payload?.data,
    ctaLink: notification.deepLink || payload?.ctaLink,
    isRead: Boolean(notification.isRead),
    timestamp: notification.createdAt,
  };
}

export class NotificationService {
  static async notifyCustomer(payload: NotificationPayload) {
    try {
      await connectDB();
      if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
        logger.error("[NotificationService] Invalid userId", payload.userId);
        return null;
      }

      const notification = await Notification.create({
        user: new mongoose.Types.ObjectId(payload.userId),
        title: payload.title,
        message: payload.message,
        type: normalizeType(payload.type),
        priority: normalizePriority(payload.priority),
        icon: payload.icon,
        deepLink: payload.ctaLink,
        metadata: payload.data,
        isRead: false,
      });

      const clientPayload = toClientNotification(notification, payload);
      try {
        await pusherServer.trigger(getUserChannel(payload.userId), "new_notification", clientPayload);
      } catch (error) {
        // Persistence succeeds independently; clients can load this notification later.
        logger.warn("[NotificationService] Notification persisted but realtime delivery failed", error);
      }
      return notification;
    } catch (error) {
      logger.error("[NotificationService] Failed to persist customer notification", error);
      return null;
    }
  }

  static async notifyAllCustomers(payload: Omit<NotificationPayload, "userId">) {
    try {
      await connectDB();
      const recipients = await User.find({ role: "customer" }).select("_id").lean();
      if (recipients.length === 0) return true;

      // Persist one record per recipient so broadcasts remain in each student's history
      // even if their browser is closed or their realtime connection is unavailable.
      const notifications = await Notification.insertMany(recipients.map((recipient: any) => ({
        user: recipient._id,
        title: payload.title,
        message: payload.message,
        type: normalizeType(payload.type),
        priority: normalizePriority(payload.priority),
        icon: payload.icon,
        deepLink: payload.ctaLink,
        metadata: payload.data,
        isRead: false,
      })));

      // Use private per-user channels; never rely on a public broadcast for student inbox delivery.
      for (let offset = 0; offset < notifications.length; offset += 20) {
        const batch = notifications.slice(offset, offset + 20);
        await Promise.all(batch.map(async (notification: any) => {
          try {
            await pusherServer.trigger(
              getUserChannel(String(notification.user)),
              "new_notification",
              toClientNotification(notification, payload),
            );
          } catch (error) {
            logger.warn("[NotificationService] Broadcast notification persisted but live delivery failed", {
              userId: String(notification.user),
              error,
            });
          }
        }));
      }
      return true;
    } catch (error) {
      logger.error("[NotificationService] Failed to persist customer broadcast", error);
      return false;
    }
  }

  static async notifyAdmin(payload: Omit<NotificationPayload, "userId"> & { adminIds?: string[] }) {
    try {
      const { adminIds, ...data } = payload;
      await connectDB();
      const recipients = adminIds?.length
        ? await User.find({ _id: { $in: adminIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) } }).select("_id").lean()
        : await User.find({ role: { $in: ["admin", "canteen_staff", "staff"] } }).select("_id").lean();
      const clientPayload = {
        title: data.title, message: data.message, type: data.type,
        priority: normalizePriority(data.priority), icon: data.icon || "🔔",
        data: data.data, ctaLink: data.ctaLink, timestamp: new Date().toISOString(),
      };
      await Promise.all(recipients.map(async (recipient: any) => {
        const userId = String(recipient._id);
        const notification = await Notification.create({
          user: new mongoose.Types.ObjectId(userId),
          title: data.title,
          message: data.message,
          type: normalizeType(data.type),
          priority: normalizePriority(data.priority),
          icon: data.icon,
          deepLink: data.ctaLink,
          metadata: data.data,
          isRead: false,
        });
        await pusherServer.trigger(getUserChannel(userId), "new_notification", {
          ...clientPayload, id: String(notification._id), userId,
          isRead: false, timestamp: notification.createdAt,
        });
      }));
      await pusherServer.trigger(ADMIN_CHANNEL, "admin_notification", clientPayload);
      return true;
    } catch (error) {
      logger.error("[NotificationService] Failed to notify admin", error);
      return false;
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    try {
      await connectDB();
      if (!mongoose.Types.ObjectId.isValid(notificationId) || !mongoose.Types.ObjectId.isValid(userId)) return null;
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: new mongoose.Types.ObjectId(userId) },
        { $set: { isRead: true } }, { new: true },
      );
      if (notification) {
        await pusherServer.trigger(getUserChannel(userId), "notification_updated", { notificationId, isRead: true });
      }
      return notification;
    } catch (error) {
      logger.error("[NotificationService] Failed to mark notification as read", error);
      return null;
    }
  }

  static async deleteNotification(notificationId: string, userId: string) {
    try {
      await connectDB();
      if (!mongoose.Types.ObjectId.isValid(notificationId) || !mongoose.Types.ObjectId.isValid(userId)) return false;
      const deleted = await Notification.findOneAndDelete({ _id: notificationId, user: new mongoose.Types.ObjectId(userId) });
      if (!deleted) return false;
      await pusherServer.trigger(getUserChannel(userId), "notification_deleted", { notificationId });
      return true;
    } catch (error) {
      logger.error("[NotificationService] Failed to delete notification", error);
      return false;
    }
  }
}

export default NotificationService;
