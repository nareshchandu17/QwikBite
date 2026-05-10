import mongoose, { Document, Schema } from 'mongoose';

export type AdminRole = 'superAdmin' | 'staff';

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  permissions: string[];
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['superAdmin', 'staff'], 
      default: 'staff' 
    },
    permissions: [{ 
      type: String,
      enum: [
        'menu_manage', 
        'orders_manage', 
        'users_manage', 
        'analytics_view',
        'promotions_manage',
        'staff_manage',
        'content_manage'
      ]
    }],
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes
adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
