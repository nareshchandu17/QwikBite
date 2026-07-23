import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Nutrition Info Interface
 */
export interface INutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

/**
 * Menu Item Interface
 */
export interface IMenuItem extends Document {
  id: string;
  name: string;
  description?: string;

  category: string;
  price: number;
  originalPrice?: number;

  image: string;

  isAvailable: boolean;

  preparationTime: number; // IMPORTANT for slot load

  tags: string[];

  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;

  isPopular: boolean;

  rating: number;
  totalOrders: number;

  nutritionInfo?: INutritionInfo;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Nutrition Schema
 */
const nutritionSchema = new Schema<INutritionInfo>(
  {
    calories: { type: Number },
    protein: { type: Number },
    carbs: { type: Number },
    fat: { type: Number },
    fiber: { type: Number },
  },
  { _id: false }
);

/**
 * Main Schema
 */
const menuItemSchema = new Schema<IMenuItem>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `MENU-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      maxlength: 500,
    },

    category: {
      type: String,
      required: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    originalPrice: {
      type: Number,
      min: 0,
    },

    image: {
      type: String,
      required: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    preparationTime: {
      type: Number,
      required: true,
      min: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    isVegetarian: {
      type: Boolean,
      default: false,
    },

    isVegan: {
      type: Boolean,
      default: false,
    },

    isGlutenFree: {
      type: Boolean,
      default: false,
    },

    isDairyFree: {
      type: Boolean,
      default: false,
    },

    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalOrders: {
      type: Number,
      default: 0,
    },

    nutritionInfo: nutritionSchema,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * INDEXES (important for performance)
 */
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ rating: -1 });
menuItemSchema.index({ totalOrders: -1 });

/**
 * STATIC METHODS
 */
menuItemSchema.statics.getAvailableItems = function () {
  return this.find({ isAvailable: true });
};

/**
 * MODEL EXPORT
 */
export const MenuItem: Model<IMenuItem> =
  mongoose.models.MenuItem ||
  mongoose.model<IMenuItem>('MenuItem', menuItemSchema);