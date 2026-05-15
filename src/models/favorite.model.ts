import mongoose, { Document, Schema, Types, Model } from 'mongoose';

export interface IFavorite extends Document {
  user: Types.ObjectId;
  menuItem: Types.ObjectId;

  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    menuItem: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

/**
 * UNIQUE CONSTRAINT (critical)
 * Prevent duplicate favorites
 */
favoriteSchema.index(
  { user: 1, menuItem: 1 },
  { unique: true }
);

/**
 * INDEXES (performance)
 */
favoriteSchema.index({ user: 1, createdAt: -1 });

/**
 * MODEL EXPORT (Next.js safe)
 */
export const Favorite: Model<IFavorite> =
  mongoose.models.Favorite ||
  mongoose.model<IFavorite>('Favorite', favoriteSchema);