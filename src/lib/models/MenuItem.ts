import mongoose, { Schema, Document } from "mongoose";

export interface INutritionInfo {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface IMenuItem extends Document {
  itemId: string;
  id: string; // Keep for backward compatibility
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  tags: string[];
  availability: boolean;
  available: boolean; // Keep for backward compatibility
  rating: number;
  totalOrders: number;
  nutritionInfo?: INutritionInfo;
  preparationTime?: number; // in minutes
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;
  isPopular?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const nutritionInfoSchema = new Schema({
  calories: { type: Number, required: true },
  protein: { type: Number },
  carbs: { type: Number },
  fat: { type: Number },
  fiber: { type: Number }
}, { _id: false });

const menuItemSchema = new Schema<IMenuItem>({
  itemId: { type: String, unique: true, sparse: true },
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  availability: { type: Boolean, default: true },
  available: { type: Boolean, default: true }, // Keep for backward compatibility
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalOrders: { type: Number, default: 0, min: 0 },
  nutritionInfo: nutritionInfoSchema,
  preparationTime: { type: Number, min: 0 }, // in minutes
  isVegetarian: { type: Boolean },
  isVegan: { type: Boolean },
  isGlutenFree: { type: Boolean },
  isDairyFree: { type: Boolean },
  isPopular: { type: Boolean }
}, {
  timestamps: true
});

// Add indexes for better query performance
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ availability: 1 });
menuItemSchema.index({ available: 1 });
menuItemSchema.index({ tags: 1 });
menuItemSchema.index({ rating: -1 });
menuItemSchema.index({ totalOrders: -1 });
menuItemSchema.index({ name: 'text', description: 'text' });

// Auto-generate itemId before saving
menuItemSchema.pre('save', async function() {
  if (!this.itemId) {
    this.itemId = this.id || `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  // Sync availability fields
  this.available = this.availability;
});

export const MenuItem = mongoose.models.MenuItem || mongoose.model<IMenuItem>("MenuItem", menuItemSchema);