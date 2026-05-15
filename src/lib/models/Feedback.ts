import mongoose, { Schema, Document, model, Types } from 'mongoose';

export interface IFeedback extends Document {
  user: Types.ObjectId;
  order: Types.ObjectId;
  rating: number;
  comment?: string;
  images?: string[];
  isAnonymous: boolean;
  status: string;
  adminComment?: string;
  menuItem?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    images: [{
      type: String,
      trim: true,
    }],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminComment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
FeedbackSchema.index({ user: 1 });
FeedbackSchema.index({ order: 1 });
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ rating: 1 });
FeedbackSchema.index({ createdAt: -1 });

// Virtual for user details
FeedbackSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

// Virtual for order details
FeedbackSchema.virtual('orderDetails', {
  ref: 'Order',
  localField: 'order',
  foreignField: '_id',
  justOne: true,
});

// Pre-save hook to ensure data consistency
FeedbackSchema.pre<IFeedback>('save', async function() {
  // Ensure rating is within bounds
  if (this.rating < 1) this.rating = 1;
  if (this.rating > 5) this.rating = 5;
  
  // Trim comment if it exists
  if (this.comment) {
    this.comment = this.comment.trim();
  }
});

// Create model with proper typing
const Feedback = mongoose.models.Feedback || model<IFeedback>('Feedback', FeedbackSchema);

export default Feedback;
