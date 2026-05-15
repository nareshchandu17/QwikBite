import mongoose, { Schema, Document } from "mongoose";

export interface IAdminNotification extends Document {
  notificationId: string;
  message: string;
  title?: string;
  type: 'broadcast' | 'targeted' | 'scheduled' | 'promotional';
  targetUsers: 'all' | string[]; // 'all' or array of userIds
  targetSegment?: 'new_users' | 'active_users' | 'inactive_users' | 'high_value';
  scheduledAt?: Date;
  sentAt?: Date;
  sentBy: string; // Admin ID
  status: 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
  deliveryStatus?: {
    total: number;
    delivered: number;
    failed: number;
  };
  deepLink?: string;
  imageUrl?: string;
  actionButton?: {
    text: string;
    link: string;
  };
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminNotificationSchema = new Schema<IAdminNotification>({
  notificationId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  title: { type: String },
  type: { 
    type: String, 
    required: true,
    enum: ['broadcast', 'targeted', 'scheduled', 'promotional'],
    default: 'broadcast',
    index: true
  },
  targetUsers: { 
    type: Schema.Types.Mixed, // Can be 'all' or array of strings
    required: true 
  },
  targetSegment: { 
    type: String,
    enum: ['new_users', 'active_users', 'inactive_users', 'high_value']
  },
  scheduledAt: { 
    type: Date,
    index: true 
  },
  sentAt: { type: Date },
  sentBy: { 
    type: String, 
    required: true,
    ref: 'Admin',
    index: true 
  },
  status: { 
    type: String,
    required: true,
    enum: ['draft', 'scheduled', 'sent', 'failed', 'cancelled'],
    default: 'draft',
    index: true
  },
  deliveryStatus: {
    total: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  deepLink: { type: String },
  imageUrl: { type: String },
  actionButton: {
    text: { type: String },
    link: { type: String }
  },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for performance
adminNotificationSchema.index({ sentBy: 1, createdAt: -1 });
adminNotificationSchema.index({ status: 1, scheduledAt: 1 });
adminNotificationSchema.index({ type: 1, sentAt: -1 });
adminNotificationSchema.index({ createdAt: -1 });

// Auto-generate notificationId before saving
adminNotificationSchema.pre('save', async function() {
  if (!this.notificationId) {
    this.notificationId = `ADMIN-NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
});

export const AdminNotification = mongoose.models.AdminNotification || mongoose.model<IAdminNotification>("AdminNotification", adminNotificationSchema);

