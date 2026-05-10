import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface IOrder extends Document {
  id: string; // Internal unique ID or ORD-xxx
  orderId?: string; // Alias for id used in some parts of the app
  userId: string;
  username?: string; // Optional username for display
  createdAt: Date;
  items: IOrderItem[];
  total: number;
  price?: number; // Alias for total
  imageUrl?: string; // For display
  originalPrice?: number; // For display
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  status: 'received' | 'preparing' | 'almost_ready' | 'ready' | 'collected' | 'delivered' | 'cancelled';
  statusText?: string;
  progressStep?: number;
  timeSlot: string;
  pickupDate: string; // YYYY-MM-DD
  loadValue: number; // Total prep time in minutes
  feedbackGiven?: boolean;
  rating?: number;
  comment?: string;
  // Payment details
  paymentIntentId?: string;
  transactionId?: string;
}

const orderItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String }
});

const orderSchema = new Schema<IOrder>({
  id: { type: String, required: true, unique: true },
  orderId: { type: String }, // Legacy compatibility
  userId: { type: String, required: true, ref: 'User' },
  username: { type: String },
  createdAt: { type: Date, default: Date.now },
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, required: true },
  price: { type: Number }, // Alias for total
  imageUrl: { type: String },
  originalPrice: { type: Number },
  paymentMethod: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['received', 'preparing', 'almost_ready', 'ready', 'collected', 'delivered', 'cancelled'],
    default: 'received'
  },
  statusText: { type: String },
  progressStep: { type: Number, default: 0 },
  timeSlot: { type: String, required: true },
  pickupDate: { type: String, required: true },
  loadValue: { type: Number, required: true, default: 0 },
  feedbackGiven: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  paymentIntentId: { type: String },
  transactionId: { type: String }
}, {
  timestamps: true
});

// Add indexes for better query performance
orderSchema.index({ id: 1 });
orderSchema.index({ userId: 1 });

// Pre-save middleware to generate order ID
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    // Generate unique order ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.id = `ORD-${timestamp}-${random}`;
    console.log('[Order Model] Generated order ID:', this.id);
  }
  next();
});

export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema, "orders");