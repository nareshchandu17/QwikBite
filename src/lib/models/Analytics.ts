import mongoose, { Schema, Document } from "mongoose";

export interface ITopItem {
  itemId: string;
  itemName: string;
  orderCount: number;
  revenue: number;
}

export interface ITopUser {
  userId: string;
  userName: string;
  totalOrders: number;
  totalSpent: number;
}

export interface IPeakHour {
  hour: number; // 0-23
  orderCount: number;
  revenue: number;
}

export interface IAnalytics extends Document {
  analyticsId: string;
  date: Date; // Date for this analytics record (daily)
  totalSales: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  cancelledOrders?: number;
  refundedAmount?: number;
  mostOrderedItems: ITopItem[];
  leastOrderedItems?: ITopItem[];
  peakHours: IPeakHour[];
  topUsers: ITopUser[];
  newUsers?: number;
  returningUsers?: number;
  paymentMethodBreakdown?: {
    cash: number;
    card: number;
    upi: number;
    wallet: number;
    stripe: number;
  };
  categoryWiseSales?: Array<{
    category: string;
    orderCount: number;
    revenue: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const topItemSchema = new Schema({
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  orderCount: { type: Number, required: true, min: 0 },
  revenue: { type: Number, required: true, min: 0 }
}, { _id: false });

const topUserSchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  totalOrders: { type: Number, required: true, min: 0 },
  totalSpent: { type: Number, required: true, min: 0 }
}, { _id: false });

const peakHourSchema = new Schema({
  hour: { type: Number, required: true, min: 0, max: 23 },
  orderCount: { type: Number, required: true, min: 0 },
  revenue: { type: Number, required: true, min: 0 }
}, { _id: false });

const analyticsSchema = new Schema<IAnalytics>({
  analyticsId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  date: { 
    type: Date, 
    required: true,
    index: true,
    unique: true // One analytics record per day
  },
  totalSales: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0 
  },
  totalOrders: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0 
  },
  totalRevenue: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0 
  },
  averageOrderValue: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  cancelledOrders: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  refundedAmount: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  mostOrderedItems: [topItemSchema],
  leastOrderedItems: [topItemSchema],
  peakHours: [peakHourSchema],
  topUsers: [topUserSchema],
  newUsers: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  returningUsers: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  paymentMethodBreakdown: {
    cash: { type: Number, default: 0, min: 0 },
    card: { type: Number, default: 0, min: 0 },
    upi: { type: Number, default: 0, min: 0 },
    wallet: { type: Number, default: 0, min: 0 },
    stripe: { type: Number, default: 0, min: 0 }
  },
  categoryWiseSales: [{
    category: { type: String, required: true },
    orderCount: { type: Number, required: true, min: 0 },
    revenue: { type: Number, required: true, min: 0 }
  }]
}, {
  timestamps: true
});

// Indexes for performance
analyticsSchema.index({ date: -1 });
analyticsSchema.index({ totalRevenue: -1 });
analyticsSchema.index({ totalOrders: -1 });
analyticsSchema.index({ createdAt: -1 });

// Auto-generate analyticsId before saving
analyticsSchema.pre('save', async function() {
  if (!this.analyticsId) {
    const dateStr = this.date.toISOString().split('T')[0].replace(/-/g, '');
    this.analyticsId = `ANALYTICS-${dateStr}`;
  }
  
  // Calculate average order value
  if (this.totalOrders > 0) {
    this.averageOrderValue = this.totalRevenue / this.totalOrders;
  }
});

export const Analytics = mongoose.models.Analytics || mongoose.model<IAnalytics>("Analytics", analyticsSchema);

