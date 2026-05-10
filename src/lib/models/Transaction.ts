import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  transactionId: string;
  userId: string;
  orderId: string;
  amount: number;
  paymentMethod: 'upi' | 'wallet' | 'card' | 'cash' | 'stripe' | 'razorpay';
  paymentStatus: 'success' | 'pending' | 'failed' | 'refunded';
  receiptURL?: string;
  refundStatus?: 'not_requested' | 'pending' | 'completed' | 'rejected';
  refundAmount?: number;
  refundReason?: string;
  paymentGatewayResponse?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  transactionId: { 
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
  orderId: { 
    type: String, 
    required: true, 
    ref: 'Order',
    index: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['upi', 'wallet', 'card', 'cash', 'stripe', 'razorpay']
  },
  paymentStatus: { 
    type: String, 
    required: true,
    enum: ['success', 'pending', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  receiptURL: { type: String },
  refundStatus: { 
    type: String,
    enum: ['not_requested', 'pending', 'completed', 'rejected'],
    default: 'not_requested'
  },
  refundAmount: { type: Number, min: 0 },
  refundReason: { type: String },
  paymentGatewayResponse: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

// Indexes for performance
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ paymentStatus: 1 });
transactionSchema.index({ createdAt: -1 });

// Auto-generate transactionId before saving
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", transactionSchema, "transactions");

