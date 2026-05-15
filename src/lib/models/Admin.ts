import mongoose, { Schema, Document } from "mongoose";

export interface IAdminPermissions {
  menuEdit?: boolean;
  orderManage?: boolean;
  userManage?: boolean;
  analyticsView?: boolean;
  feedbackManage?: boolean;
  notificationSend?: boolean;
  paymentManage?: boolean;
  reportGenerate?: boolean;
}

export interface IAdmin extends Document {
  adminId: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  profilePic?: string;
  role: 'superAdmin' | 'admin' | 'staff' | 'manager';
  permissions: IAdminPermissions;
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
  createdBy?: string; // Admin who created this account
  createdAt: Date;
  updatedAt: Date;
}

const permissionsSchema = new Schema({
  menuEdit: { type: Boolean, default: false },
  orderManage: { type: Boolean, default: false },
  userManage: { type: Boolean, default: false },
  analyticsView: { type: Boolean, default: false },
  feedbackManage: { type: Boolean, default: false },
  notificationSend: { type: Boolean, default: false },
  paymentManage: { type: Boolean, default: false },
  reportGenerate: { type: Boolean, default: false }
}, { _id: false });

const adminSchema = new Schema<IAdmin>({
  adminId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  phone: { type: String },
  password: { 
    type: String, 
    required: true,
    select: false 
  },
  profilePic: { type: String },
  role: { 
    type: String, 
    required: true,
    enum: ['superAdmin', 'admin', 'staff', 'manager'],
    default: 'staff',
    index: true
  },
  permissions: { 
    type: permissionsSchema,
    default: {} 
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true 
  },
  lastLogin: { type: Date },
  loginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockedUntil: { type: Date },
  createdBy: { 
    type: String, 
    ref: 'Admin' 
  }
}, {
  timestamps: true
});

// Indexes for performance
adminSchema.index({ role: 1, isActive: 1 });
adminSchema.index({ createdAt: -1 });

// Auto-generate adminId and set default permissions based on role
adminSchema.pre('save', async function() {
  if (!this.adminId) {
    this.adminId = `ADMIN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  // Set permissions based on role if not explicitly set
  if (this.isNew) {
    if (this.role === 'superAdmin') {
      this.permissions = {
        menuEdit: true,
        orderManage: true,
        userManage: true,
        analyticsView: true,
        feedbackManage: true,
        notificationSend: true,
        paymentManage: true,
        reportGenerate: true
      };
    } else if (this.role === 'admin') {
      this.permissions = {
        menuEdit: true,
        orderManage: true,
        userManage: false,
        analyticsView: true,
        feedbackManage: true,
        notificationSend: true,
        paymentManage: false,
        reportGenerate: true
      };
    } else if (this.role === 'manager') {
      this.permissions = {
        menuEdit: true,
        orderManage: true,
        userManage: false,
        analyticsView: true,
        feedbackManage: true,
        notificationSend: false,
        paymentManage: false,
        reportGenerate: true
      };
    }
  }
});

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>("Admin", adminSchema);

