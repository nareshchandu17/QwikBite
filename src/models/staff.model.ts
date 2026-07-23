import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Role Enum (centralized for consistency across system)
 */
export enum StaffRole {
  MANAGER = 'Manager',
  CHEF = 'Chef',
  CASHIER = 'Cashier',
  SERVER = 'Server',
  CLEANER = 'Cleaner',
}

/**
 * Status Enum for staff availability
 */
export enum StaffStatus {
  ACTIVE = 'Active',
  ON_LEAVE = 'On Leave',
  OFF_SHIFT = 'Off Shift',
}

/**
 * Staff Document Interface
 */
export interface IStaff extends Document {
  name: string;
  email: string;
  role: StaffRole;
  phone: string;
  shift: string;
  salary?: number;
  performance?: number;
  status?: StaffStatus;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Staff Schema
 */
const staffSchema = new Schema<IStaff>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email address'],
    },

    role: {
      type: String,
      enum: Object.values(StaffRole),
      default: StaffRole.SERVER,
      required: true,
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid phone number'],
    },

    shift: {
      type: String,
      required: [true, 'Shift is required'],
      trim: true,
      maxlength: 30,
    },

    salary: {
      type: Number,
      min: 0,
      default: 0,
    },

    performance: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },

    status: {
      type: String,
      enum: Object.values(StaffStatus),
      default: StaffStatus.ACTIVE,
    },

    isActive: {
      type: Boolean,
      default: true, // soft delete / active staff tracking
    },

    isDeleted: {
      type: Boolean,
      default: false, // soft delete flag
    },

    deletedAt: {
      type: Date,
      default: null, // when the record was soft deleted
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      immutable: true, // cannot be modified later
    },
  },
  {
    timestamps: true,
    versionKey: false, // cleaner documents
  }
);

/**
 * INDEXES (critical for admin dashboard performance)
 */
staffSchema.index({ role: 1 });
staffSchema.index({ shift: 1 });
staffSchema.index({ status: 1 });
staffSchema.index({ isActive: 1 });
staffSchema.index({ createdAt: -1 });

/**
 * COMPOUND INDEX (common admin filtering)
 */
staffSchema.index({ role: 1, isActive: 1 });
staffSchema.index({ status: 1, isActive: 1 });

/**
 * PRE-SAVE HOOK (optional formatting / normalization)
 */
staffSchema.pre<IStaff>('save', async function () {
  this.name = this.name.trim();
  this.phone = this.phone.trim();
});

/**
 * STATIC METHODS (future scalability)
 */
staffSchema.statics.findActiveStaff = function () {
  return this.find({ isActive: true });
};

/**
 * MODEL EXPORT (safe for Next.js hot reload)
 */
export const Staff: Model<IStaff> =
  mongoose.models.Staff ||
  mongoose.model<IStaff>('Staff', staffSchema);