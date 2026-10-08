import mongoose, { Document, Schema, Types, Model } from "mongoose";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY = "ready",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface IStatusHistory {
  status: string;
  timestamp: Date;
  note?: string;
  updatedBy?: Types.ObjectId;
}

export interface IOrderItem {
  menuItem: string | Types.ObjectId;
  name: string;
  image: string;
  quantity: number;
  price: number;
  prepTime?: number;
  id?: string;
}

export interface IOrder extends Document {
  orderId: string;
  user: string | Types.ObjectId;
  items: IOrderItem[];
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  currency?: string;
  status: string;
  statusHistory: IStatusHistory[];
  paymentStatus: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentIntentId?: string;
  idempotencyKey?: string;
  feedbackGiven?: boolean;
  rating?: number;
  comment?: string;
  slot?: Types.ObjectId;
  pickupTime?: Date;
  pickupDate?: string;
  timeSlot?: string;
  loadValue?: number;
  username?: string;
  price?: number;
  total?: number;
  estimatedReadyTime?: Date;
  assignedStaff?: Types.ObjectId;
  chefMessage?: string;
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItem: {
      type: Schema.Types.Mixed,
      ref: "MenuItem",
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    image: {
      type: String,
      default: "/placeholder-food.jpg",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
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
  { _id: false },
);

const statusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, unique: true, index: true },
    user: {
      type: Schema.Types.Mixed,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val: unknown[]) => val.length > 0, "Order must have items"],
    },
    subtotal: { type: Number, min: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", enum: ["INR"] },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "cash", "stripe", "card", "upi", "wallet"],
      default: "cod",
    },
    transactionId: String,
    paymentIntentId: { type: String, index: true, sparse: true },
    idempotencyKey: { type: String, index: true, sparse: true },
    slot: { type: Schema.Types.ObjectId, ref: "TimeSlot", index: true },
    pickupTime: Date,
    pickupDate: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    timeSlot: String,
    loadValue: { type: Number, min: 0, default: 0 },
    username: String,
    price: { type: Number, min: 0 },
    total: { type: Number, min: 0 },
    estimatedReadyTime: Date,
    assignedStaff: { type: Schema.Types.ObjectId, ref: "Staff", index: true },
    chefMessage: { type: String, maxlength: 500, trim: true },
    isCancelled: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    id: false,
  },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ pickupDate: 1, timeSlot: 1, status: 1 });
orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

orderSchema.pre<IOrder>("save", function () {
  if (!this.orderId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderId = `ORD-${timestamp}-${random}`;
  }

  if (this.isNew || this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: this.isNew ? "Order placed" : `Status updated to ${this.status}`,
    });
  }

  if (this.status === OrderStatus.CANCELLED) {
    this.isCancelled = true;
  }
});

orderSchema.statics.findActiveOrders = function () {
  return this.find({
    status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
  });
};

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
