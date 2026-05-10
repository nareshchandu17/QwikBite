import mongoose, { Document, Schema, Types, Model } from 'mongoose';

/**
 * Order Status Enum
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Payment Status Enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Status History Entry
 */
export interface IStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  updatedBy?: Types.ObjectId;
}

/**
 * Order Item Interface
 */
export interface IOrderItem {
  menuItem: string | Types.ObjectId; // Allow both for compatibility
  name: string;
  quantity: number;
  price: number;
  prepTime?: number;
}

/**
 * Order Interface
 */
export interface IOrder extends Document {
  orderId: string;
  user: string | Types.ObjectId; // Allow both for compatibility
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  statusHistory: IStatusHistory[];
  paymentStatus: PaymentStatus;
  slot?: Types.ObjectId;
  pickupTime?: Date;
  estimatedReadyTime?: Date;
  assignedStaff?: Types.ObjectId;
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order Item Schema
 */
const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItem: {
      type: Schema.Types.Mixed, // Use Mixed to allow both ObjectId and String
      ref: 'MenuItem',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    prepTime: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

/**
 * Status History Schema
 */
const statusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: String,
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

/**
 * Main Order Schema
 */
const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.Mixed, // Use Mixed to allow both ObjectId and String
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val: unknown[]) => val.length > 0, 'Order must have items'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    slot: {
      type: Schema.Types.ObjectId,
      ref: 'TimeSlot',
      index: true,
    },
    pickupTime: {
      type: Date,
    },
    estimatedReadyTime: {
      type: Date,
    },
    assignedStaff: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      index: true,
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * INDEXES
 */
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ slot: 1 });

/**
 * PRE-SAVE HOOK: Generate Order ID & Initial Status History
 */
orderSchema.pre<IOrder>('save', function (next) {
  if (!this.orderId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderId = `ORD-${timestamp}-${random}`;
  }

  // If status is new or changed, add to history
  if (this.isNew || this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: this.isNew ? 'Order placed' : `Status updated to ${this.status}`,
    });
  }

  next();
});

/**
 * STATIC METHODS
 */
orderSchema.statics.findActiveOrders = function () {
  return this.find({
    status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
  });
};

/**
 * MODEL EXPORT
 */
export const Order: Model<IOrder> =
  mongoose.models.Order ||
  mongoose.model<IOrder>('Order', orderSchema);