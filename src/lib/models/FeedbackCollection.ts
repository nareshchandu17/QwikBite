import mongoose, { Schema, Document, model, Types } from 'mongoose';

export interface IFeedbackCollection extends Document {
  feedbackId: string;
  studentId?: string;
  name?: string;
  starRating: number;
  feedbackText: string;
  adminReply?: string;
  status: 'pending' | 'approved' | 'rejected';
  image?: string;
  category?: string;
  quickRating?: string;
  reportIssue?: string[];
  orderReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackCollectionSchema = new Schema<IFeedbackCollection>(
  {
    feedbackId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    starRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedbackText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    adminReply: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    image: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    quickRating: {
      type: String,
      trim: true,
    },
    reportIssue: [{
      type: String,
      trim: true,
    }],
    orderReference: {
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
FeedbackCollectionSchema.index({ feedbackId: 1 });
FeedbackCollectionSchema.index({ studentId: 1 });
FeedbackCollectionSchema.index({ status: 1 });
FeedbackCollectionSchema.index({ starRating: 1 });
FeedbackCollectionSchema.index({ category: 1 });
FeedbackCollectionSchema.index({ createdAt: -1 });

// Pre-save hook to ensure data consistency
FeedbackCollectionSchema.pre<IFeedbackCollection>('save', async function() {
  // Ensure rating is within bounds
  if (this.starRating < 1) this.starRating = 1;
  if (this.starRating > 5) this.starRating = 5;
  
  // Trim feedback text
  if (this.feedbackText) {
    this.feedbackText = this.feedbackText.trim();
  }
  
  // Trim admin reply if it exists
  if (this.adminReply) {
    this.adminReply = this.adminReply.trim();
  }
});

// Create model with proper typing
const FeedbackCollection = mongoose.models.FeedbackCollection || model<IFeedbackCollection>('FeedbackCollection', FeedbackCollectionSchema);

export default FeedbackCollection;
