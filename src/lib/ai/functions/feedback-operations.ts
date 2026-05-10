import { FeedbackResult, EnrichedContext } from '../types';
import { connectDB } from '@/lib/db';
import Feedback from '@/models/feedback';
import { openRouterClient } from '../openrouter-client';

/**
 * Process feedback submission with AI classification
 */
export async function processFeedback(
    params: {
        orderId?: string;
        rating: number;
        text: string;
        category?: string;
    },
    context: EnrichedContext
): Promise<FeedbackResult> {
    await connectDB();

    // Validate rating
    if (params.rating < 1 || params.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
    }

    // Create feedback entry
    const feedback = await Feedback.create({
        userId: context.userState.userId,
        name: 'User', // Would come from user profile
        studentId: context.userState.userId.slice(-6),
        orderReference: params.orderId,
        quickRating: params.rating >= 4 ? 'happy' : params.rating === 3 ? 'neutral' : 'unhappy',
        starRating: params.rating,
        category: params.category || 'Other',
        feedbackText: params.text,
        reportIssue: []
    });

    // AI classification
    let classification;
    try {
        classification = await openRouterClient.classifyFeedback(params.text, params.rating);
    } catch (error) {
        console.error('[Feedback] AI classification failed:', error);
        // Fallback to rule-based classification
        classification = {
            sentiment: params.rating >= 4 ? 'positive' as const : params.rating === 3 ? 'neutral' as const : 'negative' as const,
            category: params.category || 'other',
            severity: params.rating <= 2 ? 'high' as const : params.rating === 3 ? 'medium' as const : 'low' as const,
            suggestedResponse: 'Thank you for your feedback. We will review it and take appropriate action.',
            tags: []
        };
    }

    // Determine if admin should be alerted
    const adminAlerted = classification.sentiment === 'negative' || classification.severity === 'high' || classification.severity === 'critical';

    return {
        feedback: {
            id: feedback._id.toString(),
            rating: params.rating,
            text: params.text
        },
        classification,
        adminAlerted
    };
}

/**
 * File a complaint (high-priority feedback)
 */
export async function fileComplaint(
    params: {
        orderId?: string;
        issue: string;
        description: string;
    },
    context: EnrichedContext
): Promise<FeedbackResult> {
    // File as low-rated feedback with complaint flag
    return processFeedback(
        {
            orderId: params.orderId,
            rating: 1,
            text: `COMPLAINT: ${params.issue}\n\n${params.description}`,
            category: 'Service'
        },
        context
    );
}

/**
 * Report a specific issue
 */
export async function reportIssue(
    params: {
        orderId?: string;
        issueType: string;
        description: string;
    },
    context: EnrichedContext
): Promise<{ success: boolean; message: string; ticketId: string }> {
    await connectDB();

    const feedback = await Feedback.create({
        userId: context.userState.userId,
        name: 'User',
        studentId: context.userState.userId.slice(-6),
        orderReference: params.orderId,
        quickRating: 'unhappy',
        starRating: 2,
        category: 'Other',
        feedbackText: params.description,
        reportIssue: [params.issueType]
    });

    return {
        success: true,
        message: `Issue reported successfully. Ticket ID: ${feedback.feedbackId}`,
        ticketId: feedback.feedbackId
    };
}
