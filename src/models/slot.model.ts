import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Slot Status Enum
 */
export enum SlotStatus {
  OPEN = 'open',
  FULL = 'full',
  CLOSED = 'closed',
}

/**
 * Slot Interface
 */
export interface ITimeSlot extends Document {
  startTime: Date;
  endTime: Date;

  dateOnly: string; // YYYY-MM-DD (for grouping slots)

  maxLoad: number;           // base capacity
  currentLoad: number;       // used load
  kitchenCapacityFactor: number; // dynamic multiplier

  avgPrepTime: number;       // avg prep time per order (derived)
  estimatedWaitTime: number; // minutes (derived)

  status: SlotStatus;

  isActive: boolean;
  isAutoClosed: boolean;

  createdAt: Date;
  updatedAt: Date;

  getEffectiveMaxLoad(): number;
  hasCapacity(incomingLoad: number): boolean;
}

/**
 * Static Methods Interface
 */
interface ITimeSlotModel extends Model<ITimeSlot> {
  getAvailableSlots(): Promise<ITimeSlot[]>;
  getSlotsByDate(date: string): Promise<ITimeSlot[]>;
}

/**
 * Schema
 */
const slotSchema = new Schema<ITimeSlot>(
  {
    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    dateOnly: {
      type: String,
      required: true,
      index: true,
    },

    maxLoad: {
      type: Number,
      required: true,
      min: 1,
    },

    currentLoad: {
      type: Number,
      default: 0,
      min: 0,
    },

    kitchenCapacityFactor: {
      type: Number,
      default: 1, // 1 = normal, 0.8 = slow kitchen, 1.2 = high capacity
      min: 0.1,
    },

    avgPrepTime: {
      type: Number,
      default: 0,
    },

    estimatedWaitTime: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: Object.values(SlotStatus),
      default: SlotStatus.OPEN,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isAutoClosed: {
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
slotSchema.index({ dateOnly: 1, startTime: 1 });
slotSchema.index({ status: 1 });
slotSchema.index({ isActive: 1, startTime: 1 });

/**
 * EFFECTIVE MAX LOAD (dynamic capacity)
 */
slotSchema.methods.getEffectiveMaxLoad = function () {
  return this.maxLoad * this.kitchenCapacityFactor;
};

/**
 * CAPACITY CHECK
 */
slotSchema.methods.hasCapacity = function (incomingLoad: number) {
  const effectiveMax = this.getEffectiveMaxLoad();
  return this.currentLoad + incomingLoad <= effectiveMax;
};

/**
 * PRE-SAVE HOOK
 * - auto compute dateOnly
 * - update status
 * - compute wait time
 */
slotSchema.pre<ITimeSlot>('save', function (next) {
  // dateOnly (YYYY-MM-DD)
  const date = new Date(this.startTime);
  this.dateOnly = date.toISOString().split('T')[0];

  const effectiveMax = this.maxLoad * this.kitchenCapacityFactor;

  // status logic
  if (this.currentLoad >= effectiveMax) {
    this.status = SlotStatus.FULL;
  } else if (!this.isActive) {
    this.status = SlotStatus.CLOSED;
  } else {
    this.status = SlotStatus.OPEN;
  }

  // estimated wait time (simple model)
  if (this.avgPrepTime > 0) {
    this.estimatedWaitTime = Math.ceil(
      (this.currentLoad / effectiveMax) * this.avgPrepTime
    );
  } else {
    this.estimatedWaitTime = 0;
  }

  next();
});

/**
 * STATIC: Get available slots
 */
slotSchema.statics.getAvailableSlots = function () {
  return this.find({
    isActive: true,
    status: SlotStatus.OPEN,
  }).sort({ startTime: 1 });
};

/**
 * STATIC: Get slots by date
 */
slotSchema.statics.getSlotsByDate = function (date: string) {
  return this.find({ dateOnly: date }).sort({ startTime: 1 });
};

/**
 * MODEL EXPORT
 */
export const TimeSlot = (mongoose.models.TimeSlot as ITimeSlotModel) ||
  mongoose.model<ITimeSlot, ITimeSlotModel>('TimeSlot', slotSchema);
