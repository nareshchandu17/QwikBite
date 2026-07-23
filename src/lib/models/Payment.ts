import mongoose, { Schema, Document, model, Types, Model } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'Pending',
  COMPLETED = 'Success',
  FAILED = 'Failed',
  REFUNDED = 'Refunded',
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'Card',
  CASH = 'Cash',
}

export interface IPayment extends Document {
  transactionId: string;
  orderId: string;
  userId?: Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  upiId?: string;
  stripePaymentIntentId?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
}

export interface IPaymentModel extends Model<IPayment> {
  getStatistics(dateRange?: { start: Date; end: Date }): Promise<{
    totalRevenue: number;
    pendingSettlements: number;
    failedTransactions: number;
    totalTransactions: number;
    completedTransactions: number;
  }>;
  getDailyRevenue(days?: number): Promise<Array<{
    _id: string;
    revenue: number;
    transactions: number;
  }>>;
}

const PaymentSchema = new Schema<IPayment>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
      index: true,
    },
    upiId: {
      type: String,
      trim: true,
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
    },
    items: [{
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
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
    }],
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    refundedAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ customerEmail: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ method: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ amount: 1 });

// Compound indexes for common queries
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ orderId: 1, status: 1 });

// Pre-save hook to ensure data consistency
PaymentSchema.pre<IPayment>('save', async function() {
  // Trim customer name
  if (this.customerName) {
    this.customerName = this.customerName.trim();
  }
  
  // Ensure amount is positive
  if (this.amount < 0) {
    this.amount = 0;
  }
  
  // Validate items
  if (this.items && this.items.length > 0) {
    this.items = this.items.map(item => ({
      ...item,
      name: item.name.trim(),
      quantity: Math.max(1, Math.floor(item.quantity)),
      price: Math.max(0, item.price),
    }));
  }
});

// Static方法 to get payment statistics
PaymentSchema.statics.getStatistics = async function(this: any, dateRange?: { start: Date; end: Date }) {
  const matchQuery: any = {};
  if (dateRange) {
    matchQuery.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', PaymentStatus.COMPLETED] },
              '$amount',
              0,
            ],
          },
        },
        pendingSettlements: {
          $sum: {
            $cond: [
              { $eq: ['$status', PaymentStatus.PENDING] },
              '$amount',
              0,
            ],
          },
        },
        failedTransactions: {
          $sum: {
            $cond: [
              { $eq: ['$status', PaymentStatus.FAILED] },
              1,
              0,
            ],
          },
        },
        totalTransactions: { $sum: 1 },
        completedTransactions: {
          $sum: {
            $cond: [
              { $eq: ['$status', PaymentStatus.COMPLETED] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return stats[0] || {
    totalRevenue: 0,
    pendingSettlements: 0,
    failedTransactions: 0,
    totalTransactions: 0,
    completedTransactions: 0,
  };
};

// Static method to get daily revenue
PaymentSchema.statics.getDailyRevenue = async function(this: any, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const dailyRevenue = await this.aggregate([
    {
      $match: {
        status: PaymentStatus.COMPLETED,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return dailyRevenue;
};

// Create model with proper typing
const Payment = (mongoose.models.Payment as IPaymentModel) || model<IPayment, IPaymentModel>('Payment', PaymentSchema);

export default Payment;
