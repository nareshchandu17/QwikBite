import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  userId: string;
  menuItemId: string;
  menuItemName?: string;
  menuItemImage?: string;
  menuItemPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>({
  userId: { type: String, required: true, ref: 'User' },
  menuItemId: { type: String, required: true, ref: 'MenuItem' },
  menuItemName: { type: String },
  menuItemImage: { type: String },
  menuItemPrice: { type: Number }
}, {
  timestamps: true
});

// Add indexes for better query performance
favoriteSchema.index({ userId: 1 });
favoriteSchema.index({ menuItemId: 1 });
favoriteSchema.index({ userId: 1, menuItemId: 1 }, { unique: true });
favoriteSchema.index({ createdAt: -1 });

export const Favorite = mongoose.models.Favorite || mongoose.model<IFavorite>("Favorite", favoriteSchema);