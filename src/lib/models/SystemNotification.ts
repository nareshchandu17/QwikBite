import mongoose, { Schema, Document, Types, model } from 'mongoose';

export interface ISystemNotification extends Document {
  userId: Types.ObjectId;
  role: 'admin' | 'customer';
  title: string;
  link: string;
  isRead: boolean;
  createdAt: Date;
}

// No custom static methods needed currently

const SystemNotificationSchema = new Schema<ISystemNotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for admin notifications
      index: true
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    link: {
      type: String,
      required: true,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for optimal queries
SystemNotificationSchema.index({ userId: 1, role: 1, createdAt: -1 });
SystemNotificationSchema.index({ role: 1, isRead: 1, createdAt: -1 });

// Pre-save hook for data consistency
SystemNotificationSchema.pre<ISystemNotification>('save', function(next) {
  if (this.title) {
    this.title = this.title.trim();
  }
  if (this.link) {
    this.link = this.link.trim();
  }
  next();
});

const SystemNotification = mongoose.models.SystemNotification || model<ISystemNotification>('SystemNotification', SystemNotificationSchema);

export default SystemNotification;
