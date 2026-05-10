import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  feedbackId: string;
  userId: mongoose.Types.ObjectId | string;
  name: string;
  studentId: string;
  orderReference?: string;
  quickRating: string;
  starRating: number;
  category: string;
  feedbackText: string;
  reportIssue: string[];
  image?: string;
  adminReply?: string;
  message?: string;
  rating?: number;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    feedbackId: {
      type: String,
      required: true,
      unique: true,
      default: () => `FB${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: false,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    orderReference: {
      type: String,
      trim: true,
    },
    quickRating: {
      type: String,
      required: true,
      enum: ['happy', 'neutral', 'unhappy', 'Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
    },
    starRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    category: {
      type: String,
      required: true,
      enum: ['Food', 'Cleanliness', 'Food Quality', 'Service', 'Delivery', 'App Experience', 'Other'],
    },
    feedbackText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    reportIssue: [{
      type: String,
      enum: ['hygiene', 'delay', 'Incorrect Order', 'Late Delivery', 'Food Quality', 'Rude Staff', 'Other'],
    }],
    image: {
      type: String,
      trim: true,
    },
    adminReply: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 5000
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    meta: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for common queries
FeedbackSchema.index({ userId: 1, createdAt: -1 });

// Prevent Mongoose OverwriteModelError in development by deleting the model if it exists
if (process.env.NODE_ENV === 'development' && mongoose.models.Feedback) {
  delete mongoose.models.Feedback;
}

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);