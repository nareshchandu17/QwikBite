/**
 * Elite Feedback Intelligence Service
 * 
 * Production-grade AI-powered feedback analyzer for qwikBite Admin Panel.
 * Goes beyond simple sentiment to provide actionable operational intelligence.
 * 
 * @module FeedbackIntelligenceService
 */

import { openRouterClient } from './openrouter-client';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type OverallSentiment = 'Positive' | 'Mixed' | 'Negative' | 'Neutral';

export type UserIntent =
    | 'Praise'
    | 'Complaint'
    | 'Suggestion'
    | 'Confusion'
    | 'Frustration'
    | 'Feature Request'
    | 'Operational Issue'
    | 'Payment Issue'
    | 'Service Delay'
    | 'Unclear';

export type EmotionalIntensity = 'Low' | 'Medium' | 'High';

export type OperationalImpact = 'None' | 'Low' | 'Medium' | 'High';

export type PriorityLevel = 'Informational' | 'Monitor' | 'Needs Attention' | 'Urgent';

export interface FeedbackContext {
    page?: string;
    orderState?: 'completed' | 'delayed' | 'cancelled' | 'pending';
    time?: 'peak' | 'non-peak';
    orderReference?: string;
}

export interface FeedbackAnalysisResult {
    overallSentiment: OverallSentiment;
    userIntent: UserIntent[];
    emotionalIntensity: EmotionalIntensity;
    keyInsight: string;
    operationalImpact: OperationalImpact;
    priorityLevel: PriorityLevel;
    recommendedAction: string;
    tags: string[];
    suggestedResponse: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTION-GRADE SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are the qwikBite Feedback Intelligence Engine,
embedded inside the Admin Panel.

Your role is to analyze customer feedback submitted through
the application and convert it into actionable operational insight.

You are NOT a generic sentiment analyzer.
You are a decision-support system for admins.

────────────────────────────────────
CORE OBJECTIVES
────────────────────────────────────

1. Accurately understand the user's feedback.
2. Classify feedback beyond simple positive/neutral/negative.
3. Identify intent, emotion, urgency, and impact.
4. Recommend clear next actions for the admin.

────────────────────────────────────
INPUT FORMAT
────────────────────────────────────

You will receive:
- feedback_text: string
- context (optional):
  • page submitted from (order, delivery, payment, general)
  • order state (completed, delayed, cancelled)
  • time (peak / non-peak)

────────────────────────────────────
OUTPUT FORMAT (STRICT)
────────────────────────────────────

Return a structured analysis with the following fields:

1. Overall Sentiment
   - Positive / Mixed / Negative / Neutral

2. User Intent (one or more)
   - Praise
   - Complaint
   - Suggestion
   - Confusion
   - Frustration
   - Feature Request
   - Operational Issue
   - Payment Issue
   - Service Delay
   - Unclear

3. Emotional Intensity
   - Low
   - Medium
   - High

4. Key Insight (1–2 lines)
   - Summarize the real problem or appreciation in plain language.

5. Operational Impact
   - None
   - Low
   - Medium
   - High

6. Priority Level
   - Informational
   - Monitor
   - Needs Attention
   - Urgent

7. Recommended Admin Action
   - Concrete next step (not generic advice).

8. Tags
   - Specific issues or topics mentioned (e.g., "lunch-queue", "food-quality", "payment-failure")

9. Suggested Response
   - Professional reply template for admin to use

────────────────────────────────────
ANALYSIS RULES
────────────────────────────────────

- Do NOT rely on keywords alone.
- Understand tone, implication, and context.
- Mixed feedback must be labeled as Mixed, not Neutral.
- Suggestions are NOT complaints unless frustration is present.
- Praise with a condition should still highlight the issue.

────────────────────────────────────
TONE & STYLE
────────────────────────────────────

- Professional
- Clear
- Operational
- No emojis
- No filler text

────────────────────────────────────
FAIL-SAFE BEHAVIOR
────────────────────────────────────

- If feedback is vague, mark intent as "Unclear" and suggest monitoring.
- Never invent facts not present in the feedback.
- Never exaggerate urgency unless strongly implied.

────────────────────────────────────
SUCCESS CRITERIA
────────────────────────────────────

Admins should be able to:
• Scan feedback in seconds
• Know what matters
• Know what to do next`;

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK INTELLIGENCE SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class FeedbackIntelligenceService {
    /**
     * Analyze feedback and return elite classification
     */
    async analyze(
        feedbackText: string,
        rating: number,
        context?: FeedbackContext
    ): Promise<FeedbackAnalysisResult> {
        // Validate input
        if (!feedbackText || feedbackText.trim().length === 0) {
            throw new Error('Feedback text cannot be empty');
        }

        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        // Build context string
        const contextStr = this.buildContextString(context);

        // Prepare user message
        const userMessage = `${contextStr}

Rating: ${rating}/5
Feedback: "${feedbackText}"`;

        try {
            // Call OpenRouter with function calling
            const response = await openRouterClient.chat({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ],
                functions: [
                    {
                        name: 'analyze_feedback',
                        description: 'Analyze customer feedback and provide elite classification',
                        parameters: {
                            type: 'object',
                            properties: {
                                overallSentiment: {
                                    type: 'string',
                                    enum: ['Positive', 'Mixed', 'Negative', 'Neutral']
                                },
                                userIntent: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        enum: [
                                            'Praise',
                                            'Complaint',
                                            'Suggestion',
                                            'Confusion',
                                            'Frustration',
                                            'Feature Request',
                                            'Operational Issue',
                                            'Payment Issue',
                                            'Service Delay',
                                            'Unclear'
                                        ]
                                    }
                                },
                                emotionalIntensity: {
                                    type: 'string',
                                    enum: ['Low', 'Medium', 'High']
                                },
                                keyInsight: {
                                    type: 'string',
                                    description: '1-2 line summary of the real problem or appreciation'
                                },
                                operationalImpact: {
                                    type: 'string',
                                    enum: ['None', 'Low', 'Medium', 'High']
                                },
                                priorityLevel: {
                                    type: 'string',
                                    enum: ['Informational', 'Monitor', 'Needs Attention', 'Urgent']
                                },
                                recommendedAction: {
                                    type: 'string',
                                    description: 'Concrete next step for admin (not generic advice)'
                                },
                                tags: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Specific issues or topics mentioned'
                                },
                                suggestedResponse: {
                                    type: 'string',
                                    description: 'Professional reply template for admin'
                                }
                            },
                            required: [
                                'overallSentiment',
                                'userIntent',
                                'emotionalIntensity',
                                'keyInsight',
                                'operationalImpact',
                                'priorityLevel',
                                'recommendedAction',
                                'tags',
                                'suggestedResponse'
                            ]
                        }
                    }
                ],
                function_call: { name: 'analyze_feedback' },
                temperature: 0.4,
                max_tokens: 500
            });

            // Extract function call result
            const functionCall = response.choices[0]?.message?.function_call;
            if (!functionCall) {
                throw new Error('No function call in OpenRouter response');
            }

            const result = JSON.parse(functionCall.arguments);

            // Validate result
            this.validateAnalysisResult(result);

            return result as FeedbackAnalysisResult;

        } catch (error) {
            console.error('[FeedbackIntelligence] Analysis failed:', error);

            // Fallback to basic classification
            return this.getFallbackAnalysis(feedbackText, rating);
        }
    }

    /**
     * Build context string from context object
     */
    private buildContextString(context?: FeedbackContext): string {
        if (!context) {
            return 'Context: General feedback (no specific context provided)';
        }

        const parts: string[] = ['Context:'];

        if (context.page) {
            parts.push(`Page: ${context.page}`);
        }

        if (context.orderState) {
            parts.push(`Order State: ${context.orderState}`);
        }

        if (context.time) {
            parts.push(`Time: ${context.time}`);
        }

        if (context.orderReference) {
            parts.push(`Order: #${context.orderReference}`);
        }

        return parts.join(' | ');
    }

    /**
     * Validate analysis result structure
     */
    private validateAnalysisResult(result: any): void {
        const required = [
            'overallSentiment',
            'userIntent',
            'emotionalIntensity',
            'keyInsight',
            'operationalImpact',
            'priorityLevel',
            'recommendedAction',
            'tags',
            'suggestedResponse'
        ];

        for (const field of required) {
            if (!(field in result)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (!Array.isArray(result.userIntent) || result.userIntent.length === 0) {
            throw new Error('userIntent must be a non-empty array');
        }

        if (!Array.isArray(result.tags)) {
            throw new Error('tags must be an array');
        }
    }

    /**
     * Fallback analysis when AI fails
     */
    private getFallbackAnalysis(feedbackText: string, rating: number): FeedbackAnalysisResult {
        // Basic sentiment based on rating
        let overallSentiment: OverallSentiment;
        let priorityLevel: PriorityLevel;

        if (rating >= 4) {
            overallSentiment = 'Positive';
            priorityLevel = 'Informational';
        } else if (rating >= 3) {
            overallSentiment = 'Neutral';
            priorityLevel = 'Monitor';
        } else {
            overallSentiment = 'Negative';
            priorityLevel = 'Needs Attention';
        }

        return {
            overallSentiment,
            userIntent: ['Unclear'],
            emotionalIntensity: 'Medium',
            keyInsight: 'AI analysis unavailable. Manual review recommended.',
            operationalImpact: 'Low',
            priorityLevel,
            recommendedAction: 'Review feedback manually and respond appropriately.',
            tags: ['ai-fallback'],
            suggestedResponse: 'Thank you for your feedback. We appreciate you taking the time to share your experience with us.'
        };
    }
}

// Singleton instance
export const feedbackIntelligenceService = new FeedbackIntelligenceService();
