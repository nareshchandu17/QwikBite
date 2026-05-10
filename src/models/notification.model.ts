import mongoose, { Schema, Document, Types, Model } from 'mongoose';

/**
 * Notification Types
 */
export enum NotificationType {
  ORDER_UPDATE = 'order_update',
  PAYMENT = 'payment',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  ADMIN = 'admin',
}

/**
 * Notification Priority
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

/**
 * Notification Interface
 */
export interface INotification extends Document {
  user: Types.ObjectId;

  title: string;
  message: string;

  type: NotificationType;
  priority: NotificationPriority;

  isRead: boolean;

  deepLink?: string; // redirect URL
  icon?: string;

  metadata?: Record<string, unknown>; // flexible payload (orderId, etc.)

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema
 */
const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      maxlength: 100,
    },

    message: {
      type: String,
      required: true,
      maxlength: 300,
    },

    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.SYSTEM,
      index: true,
    },

    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.NORMAL,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    deepLink: {
      type: String,
    },

    icon: {
      type: String,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * INDEXES (critical for performance)
 */
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

/**
 * STATIC METHODS
 */
notificationSchema.statics.getUnreadCount = function (userId: Types.ObjectId) {
  return this.countDocuments({ user: userId, isRead: false });
};

/**
 * INSTANCE METHODS
 */
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  return this.save();
};

/**
 * MODEL EXPORT (Next.js safe)
 */
export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);