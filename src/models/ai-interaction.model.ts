import mongoose, { Document, Schema } from 'mongoose';

export interface IAIInteraction extends Document {
    userId: mongoose.Types.ObjectId | string;
    message: string;
    intent: string;
    confidence: number;
    pageContext: {
        currentPage: string;
        route: string;
    };
    actionTaken?: string;
    result: 'success' | 'error' | 'clarification';
    responseTime: number;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

const AIInteractionSchema = new Schema<IAIInteraction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true
        },
        message: {
            type: String,
            required: true,
            maxlength: 500
        },
        intent: {
            type: String,
            required: true,
            index: true
        },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 1
        },
        pageContext: {
            currentPage: { type: String, required: true },
            route: { type: String, required: true }
        },
        actionTaken: {
            type: String
        },
        result: {
            type: String,
            enum: ['success', 'error', 'clarification'],
            required: true,
            index: true
        },
        responseTime: {
            type: Number,
            required: true
        },
        metadata: {
            type: Schema.Types.Mixed
        }
    },
    {
        timestamps: true
    }
);

// Indexes for analytics queries
AIInteractionSchema.index({ userId: 1, timestamp: -1 });
AIInteractionSchema.index({ intent: 1, result: 1 });
AIInteractionSchema.index({ timestamp: -1 });

// Prevent model overwrite in development
if (process.env.NODE_ENV === 'development' && mongoose.models.AIInteraction) {
    delete mongoose.models.AIInteraction;
}

export default mongoose.models.AIInteraction || mongoose.model<IAIInteraction>('AIInteraction', AIInteractionSchema);
