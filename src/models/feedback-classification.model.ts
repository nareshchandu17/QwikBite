import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedbackClassification extends Document {
    feedbackId: mongoose.Types.ObjectId | string;

    // ═══════════════════════════════════════════════════════════════════════
    // ELITE CLASSIFICATION FIELDS (5-Dimension Intelligence)
    // ═══════════════════════════════════════════════════════════════════════

    overallSentiment: 'Positive' | 'Mixed' | 'Negative' | 'Neutral';
    userIntent: string[];  // Multiple intents possible (Praise, Complaint, etc.)
    emotionalIntensity: 'Low' | 'Medium' | 'High';
    keyInsight: string;  // 1-2 line summary of the real problem or appreciation
    operationalImpact: 'None' | 'Low' | 'Medium' | 'High';
    priorityLevel: 'Informational' | 'Monitor' | 'Needs Attention' | 'Urgent';
    recommendedAction: string;  // Concrete next step for admin

    // ═══════════════════════════════════════════════════════════════════════
    // LEGACY FIELDS (kept for backward compatibility)
    // ═══════════════════════════════════════════════════════════════════════

    sentiment?: 'positive' | 'neutral' | 'negative';  // Deprecated, use overallSentiment
    category?: 'food_quality' | 'service' | 'pricing' | 'delivery' | 'hygiene' | 'other';
    severity?: 'low' | 'medium' | 'high' | 'critical';  // Deprecated, use priorityLevel

    // ═══════════════════════════════════════════════════════════════════════
    // SHARED FIELDS
    // ═══════════════════════════════════════════════════════════════════════

    suggestedResponse: string;  // Professional reply template
    tags: string[];  // Specific issues mentioned
    context?: {
        page?: string;
        orderState?: 'completed' | 'delayed' | 'cancelled' | 'pending';
        time?: 'peak' | 'non-peak';
        orderReference?: string;
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AI REPLY SYSTEM
    // ═══════════════════════════════════════════════════════════════════════

    aiGeneratedReply?: string;  // AI-drafted reply text
    replyStatus: 'pending_review' | 'auto_sent' | 'admin_approved' | 'escalated' | 'none';
    autoReplyEligible: boolean;  // Can AI auto-send?
    escalationReason?: string;  // Why escalated (if applicable)
    replySentAt?: Date;
    replySentBy?: 'ai' | 'admin';

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN REVIEW TRACKING
    // ═══════════════════════════════════════════════════════════════════════

    adminReviewed: boolean;
    reviewedBy?: mongoose.Types.ObjectId | string;
    reviewedAt?: Date;
    timestamp: Date;
}

const FeedbackClassificationSchema = new Schema<IFeedbackClassification>(
    {
        feedbackId: {
            type: Schema.Types.ObjectId,
            required: true,
            unique: true,
            index: true
        },

        // ═══════════════════════════════════════════════════════════════════
        // ELITE CLASSIFICATION FIELDS
        // ═══════════════════════════════════════════════════════════════════

        overallSentiment: {
            type: String,
            enum: ['Positive', 'Mixed', 'Negative', 'Neutral'],
            required: true,
            index: true
        },
        userIntent: [{
            type: String,
            required: true
        }],
        emotionalIntensity: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            required: true
        },
        keyInsight: {
            type: String,
            required: true,
            maxlength: 500
        },
        operationalImpact: {
            type: String,
            enum: ['None', 'Low', 'Medium', 'High'],
            required: true,
            index: true
        },
        priorityLevel: {
            type: String,
            enum: ['Informational', 'Monitor', 'Needs Attention', 'Urgent'],
            required: true,
            index: true
        },
        recommendedAction: {
            type: String,
            required: true,
            maxlength: 1000
        },

        // ═══════════════════════════════════════════════════════════════════
        // LEGACY FIELDS (optional for backward compatibility)
        // ═══════════════════════════════════════════════════════════════════

        sentiment: {
            type: String,
            enum: ['positive', 'neutral', 'negative'],
            required: false
        },
        category: {
            type: String,
            enum: ['food_quality', 'service', 'pricing', 'delivery', 'hygiene', 'other'],
            required: false
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            required: false
        },

        // ═══════════════════════════════════════════════════════════════════
        // SHARED FIELDS
        // ═══════════════════════════════════════════════════════════════════

        suggestedResponse: {
            type: String,
            required: true,
            maxlength: 1000
        },
        tags: [{
            type: String
        }],
        context: {
            type: Schema.Types.Mixed,
            required: false
        },

        // ═══════════════════════════════════════════════════════════════════
        // AI REPLY SYSTEM
        // ═══════════════════════════════════════════════════════════════════

        aiGeneratedReply: {
            type: String,
            required: false,
            maxlength: 1000
        },
        replyStatus: {
            type: String,
            enum: ['pending_review', 'auto_sent', 'admin_approved', 'escalated', 'none'],
            default: 'none',
            index: true
        },
        autoReplyEligible: {
            type: Boolean,
            default: false
        },
        escalationReason: {
            type: String,
            required: false
        },
        replySentAt: {
            type: Date,
            required: false
        },
        replySentBy: {
            type: String,
            enum: ['ai', 'admin'],
            required: false
        },

        // ═══════════════════════════════════════════════════════════════════
        // ADMIN REVIEW TRACKING
        // ═══════════════════════════════════════════════════════════════════

        adminReviewed: {
            type: Boolean,
            default: false,
            index: true
        },
        reviewedBy: {
            type: Schema.Types.ObjectId
        },
        reviewedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

// ═══════════════════════════════════════════════════════════════════════════
// INDEXES FOR ELITE ADMIN DASHBOARD QUERIES
// ═══════════════════════════════════════════════════════════════════════════

// Priority-based filtering (most common use case)
FeedbackClassificationSchema.index({ priorityLevel: 1, adminReviewed: 1 });
FeedbackClassificationSchema.index({ priorityLevel: 1, createdAt: -1 });

// Operational impact filtering
FeedbackClassificationSchema.index({ operationalImpact: 1, adminReviewed: 1 });

// Sentiment filtering
FeedbackClassificationSchema.index({ overallSentiment: 1, adminReviewed: 1 });

// Combined priority + sentiment (for advanced filtering)
FeedbackClassificationSchema.index({ priorityLevel: 1, overallSentiment: 1 });

// Time-based queries
FeedbackClassificationSchema.index({ createdAt: -1 });

// Legacy indexes (kept for backward compatibility)
FeedbackClassificationSchema.index({ sentiment: 1, adminReviewed: 1 });
FeedbackClassificationSchema.index({ severity: 1, adminReviewed: 1 });

// Prevent model overwrite in development
if (process.env.NODE_ENV === 'development' && mongoose.models.FeedbackClassification) {
    delete mongoose.models.FeedbackClassification;
}

export default mongoose.models.FeedbackClassification || mongoose.model<IFeedbackClassification>('FeedbackClassification', FeedbackClassificationSchema);
