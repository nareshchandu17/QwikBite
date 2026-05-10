/**
 * Reply Safety Classifier
 * 
 * Determines if AI can auto-reply or if admin review is required.
 * 
 * @module ReplySafetyClassifier
 */

import type { FeedbackAnalysisResult } from './feedback-intelligence.service';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface SafetyClassification {
    autoReplyEligible: boolean;
    reason: string;
    riskLevel: 'safe' | 'review_recommended' | 'high_risk';
}

// ═══════════════════════════════════════════════════════════════════════════
// SAFETY CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine if feedback is safe for auto-reply
 * 
 * Safe categories (auto-reply eligible):
 * - Praise
 * - Neutral suggestion
 * - Minor inconvenience
 * - Feature request
 * - Clarification
 * 
 * Escalation categories (require admin review):
 * - Angry/abusive language
 * - Refund/money loss
 * - Legal threat
 * - Repeated complaints
 * - Payment disputes
 */
export function isAutoReplyEligible(
    analysis: FeedbackAnalysisResult,
    _feedbackText: string
): SafetyClassification {
    // ═══════════════════════════════════════════════════════════════════════
    // HIGH-RISK CONDITIONS (require admin review)
    // ═══════════════════════════════════════════════════════════════════════

    // Payment issues - NEVER auto-reply
    if (analysis.userIntent.includes('Payment Issue')) {
        return {
            autoReplyEligible: false,
            reason: 'Payment issue detected - requires admin review',
            riskLevel: 'high_risk'
        };
    }

    // Urgent priority - requires admin attention
    if (analysis.priorityLevel === 'Urgent') {
        return {
            autoReplyEligible: false,
            reason: 'Urgent priority - requires immediate admin attention',
            riskLevel: 'high_risk'
        };
    }

    // High emotional intensity - handle with care
    if (analysis.emotionalIntensity === 'High') {
        return {
            autoReplyEligible: false,
            reason: 'High emotional intensity - requires empathetic admin response',
            riskLevel: 'high_risk'
        };
    }

    // High operational impact complaints
    if (
        analysis.userIntent.includes('Complaint') &&
        analysis.operationalImpact === 'High'
    ) {
        return {
            autoReplyEligible: false,
            reason: 'High-impact complaint - requires admin investigation',
            riskLevel: 'high_risk'
        };
    }

    // Frustration with operational issues
    if (
        analysis.userIntent.includes('Frustration') &&
        analysis.operationalImpact !== 'None'
    ) {
        return {
            autoReplyEligible: false,
            reason: 'Frustrated customer with operational issue - requires admin review',
            riskLevel: 'review_recommended'
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SAFE CONDITIONS (auto-reply eligible)
    // ═══════════════════════════════════════════════════════════════════════

    // Praise - always safe to auto-reply
    if (analysis.userIntent.includes('Praise') && analysis.overallSentiment === 'Positive') {
        return {
            autoReplyEligible: true,
            reason: 'Positive praise - safe for auto-reply',
            riskLevel: 'safe'
        };
    }

    // Feature requests - safe to acknowledge
    if (analysis.userIntent.includes('Feature Request')) {
        return {
            autoReplyEligible: true,
            reason: 'Feature request - safe for auto-reply',
            riskLevel: 'safe'
        };
    }

    // Suggestions - safe to acknowledge
    if (
        analysis.userIntent.includes('Suggestion') &&
        (analysis.emotionalIntensity as string) !== 'High'
    ) {
        return {
            autoReplyEligible: true,
            reason: 'Constructive suggestion - safe for auto-reply',
            riskLevel: 'safe'
        };
    }

    // Informational feedback
    if (analysis.priorityLevel === 'Informational') {
        return {
            autoReplyEligible: true,
            reason: 'Informational feedback - safe for auto-reply',
            riskLevel: 'safe'
        };
    }

    // Mixed sentiment with low impact
    if (
        analysis.overallSentiment === 'Mixed' &&
        analysis.operationalImpact === 'Low' &&
        analysis.emotionalIntensity === 'Low'
    ) {
        return {
            autoReplyEligible: true,
            reason: 'Low-impact mixed feedback - safe for auto-reply',
            riskLevel: 'safe'
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEFAULT: REQUIRE REVIEW
    // ═══════════════════════════════════════════════════════════════════════

    // When in doubt, require admin review
    return {
        autoReplyEligible: false,
        reason: 'Default safety policy - requires admin review',
        riskLevel: 'review_recommended'
    };
}

/**
 * Get human-readable explanation of safety decision
 */
export function getSafetyExplanation(classification: SafetyClassification): string {
    const emoji = classification.autoReplyEligible ? '✅' : '⚠️';
    return `${emoji} ${classification.reason}`;
}
