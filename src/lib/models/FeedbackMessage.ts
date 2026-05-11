import mongoose, { Schema, Document, Types, model } from 'mongoose';

export interface IFeedbackMessage extends Document {
  customerId: Types.ObjectId;
  message: string;
  reply: string | null;
  status: 'open' | 'replied';
  createdAt: Date;
  updatedAt: Date;
}

// No custom static methods needed currently

const FeedbackMessageSchema = new Schema<IFeedbackMessage>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    reply: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null
    },
    status: {
      type: String,
      enum: ['open', 'replied'],
      default: 'open',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for optimal queries
FeedbackMessageSchema.index({ customerId: 1, createdAt: -1 });
FeedbackMessageSchema.index({ status: 1, createdAt: -1 });

// Virtual for customer details
FeedbackMessageSchema.virtual('customerDetails', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook for data consistency
FeedbackMessageSchema.pre<IFeedbackMessage>('save', function(next) {
  if (this.message) {
    this.message = this.message.trim();
  }
  if (this.reply) {
    this.reply = this.reply.trim();
  }
  
  // Auto-update status when reply is added
  if (this.reply && this.status === 'open') {
    this.status = 'replied';
  }
  
  next();
});

const FeedbackMessage = mongoose.models.FeedbackMessage || model<IFeedbackMessage>('FeedbackMessage', FeedbackMessageSchema);

export default FeedbackMessage;
