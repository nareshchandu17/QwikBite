import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyAnalytics extends Document {
  date: Date;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  newUsers: number;
  mostOrderedItems: Array<{
    menuItem: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  peakHours: Array<{
    hour: number;
    orderCount: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  orderStatus: Array<{
    status: string;
    count: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<IDailyAnalytics>(
  {
    date: { type: Date, required: true, unique: true },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    mostOrderedItems: [{
      menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      revenue: { type: Number, required: true }
    }],
    peakHours: [{
      hour: { type: Number, required: true, min: 0, max: 23 },
      orderCount: { type: Number, required: true }
    }],
    paymentMethods: [{
      method: { type: String, required: true },
      count: { type: Number, required: true },
      total: { type: Number, required: true }
    }],
    orderStatus: [{
      status: { type: String, required: true },
      count: { type: Number, required: true }
    }]
  },
  { timestamps: true }
);

// Indexes for efficient querying
analyticsSchema.index({ 'mostOrderedItems.menuItem': 1 });
analyticsSchema.index({ 'paymentMethods.method': 1 });

export const DailyAnalytics = mongoose.model<IDailyAnalytics>('DailyAnalytics', analyticsSchema);
