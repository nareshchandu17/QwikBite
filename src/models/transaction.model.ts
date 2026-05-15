import mongoose, { Schema, Document } from 'mongoose';

export type PaymentMethod = 'card' | 'upi' | 'cash' | 'wallet' | 'netbanking';
export type RefundStatus = 'none' | 'requested' | 'processing' | 'completed' | 'failed';

export interface ITransaction extends Document {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: string;
  refundStatus: string;
  stripePaymentIntentId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    orderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'inr' },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'cash', 'wallet', 'netbanking'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'processing', 'completed', 'failed'],
      default: 'none',
    },
    stripePaymentIntentId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);
