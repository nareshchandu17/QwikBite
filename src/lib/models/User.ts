import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  userId: string;
  name: string;
  regNo: string;
  email: string;
  phone?: string;
  password: string;
  profilePic?: string;
  role: 'customer' | 'admin' | 'canteen_staff';
  walletBalance?: number;
  address?: string;
  addresses?: unknown[];
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  userId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  regNo: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true, select: false },
  profilePic: { type: String },
  role: {
    type: String,
    enum: ['customer', 'admin', 'canteen_staff', 'user', 'staff'], // Include aliases for compatibility
    default: 'customer'
  },
  walletBalance: { type: Number, default: 0, min: 0 },
  address: { type: String },
  addresses: { type: [Schema.Types.Mixed], default: [] },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date }
}, {
  timestamps: true
});

// Only create indexes if we're not in an edge runtime environment
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  try {
    userSchema.index({ role: 1 });
    userSchema.index({ createdAt: -1 });
  } catch (error) {
    console.warn('Could not create indexes in edge runtime:', error);
  }
}

// Auto-generate userId and hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.userId) {
    this.userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error: unknown) {
      return next(error);
    }
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    // If password field is not loaded (select: false), we need to fetch it or warn
    if (!this.password) {
      console.warn('User object does not have password field loaded. Ensure you used .select("+password")');
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
