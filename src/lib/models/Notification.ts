import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  notificationId: string;
  userId: string;
  message: string;
  title?: string;
  type: 'order_update' | 'promo' | 'system' | 'payment' | 'offer' | 'feedback';
  isRead: boolean;
  deepLink?: string; // URL to navigate when clicked
  data?: unknown; // Additional data (orderId, itemId, etc.)
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  notificationId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  userId: { 
    type: String, 
    required: true, 
    ref: 'User',
    index: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  title: { type: String },
  type: { 
    type: String, 
    required: true,
    enum: ['order_update', 'promo', 'system', 'payment', 'offer', 'feedback'],
    index: true
  },
  isRead: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  deepLink: { type: String },
  data: { type: Schema.Types.Mixed },
  priority: { 
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Auto-generate notificationId before saving
notificationSchema.pre('save', async function() {
  if (!this.notificationId) {
    this.notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
});

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", notificationSchema);

