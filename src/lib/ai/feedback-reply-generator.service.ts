/**
 * AI Feedback Reply Generator Service
 * 
 * Production-grade AI reply system with strict safety controls.
 * Auto-replies to safe feedback, escalates high-risk cases to admin.
 * 
 * @module FeedbackReplyGenerator
 */

import { openRouterClient } from './openrouter-client';
import type { FeedbackAnalysisResult } from './feedback-intelligence.service';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface ReplyGenerationResult {
    reply: string;
    escalate: boolean;
    escalationReason?: string;
    tone: 'warm' | 'appreciative' | 'empathetic' | 'neutral';
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTION-GRADE SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are the qwikBite Automated Feedback Response Engine.

Your role is to generate polite, empathetic, and rule-compliant
responses to customer feedback submitted through the application.

You are NOT a customer support agent.
You are NOT allowed to promise refunds, compensation, or policy changes.
You must follow platform safety and feedback guidelines at all times.

────────────────────────────────────
INPUT YOU RECEIVE
────────────────────────────────────

- feedback_text
- feedback_analysis:
  • sentiment
  • user_intent
  • emotional_intensity
  • priority_level

────────────────────────────────────
YOUR GOAL
────────────────────────────────────

Generate a response that:
1. Acknowledges the user's feedback
2. Matches the emotional tone appropriately
3. Thanks the user sincerely
4. Avoids blame or defensiveness
5. Does NOT violate platform or business rules
6. Does NOT promise specific outcomes

────────────────────────────────────
RESPONSE RULES (STRICT)
────────────────────────────────────

✔ Use calm, professional language
✔ Be empathetic but neutral
✔ Keep replies short (2–4 sentences)
✔ Use "we" instead of "I"
✔ Focus on acknowledgment, not justification

✗ Do NOT mention internal processes
✗ Do NOT mention AI
✗ Do NOT ask follow-up questions
✗ Do NOT say "we will fix this immediately"
✗ Do NOT assign blame
✗ Do NOT give timelines or guarantees

────────────────────────────────────
TONE MATCHING RULES
────────────────────────────────────

- Positive feedback → Warm appreciation
- Neutral / suggestion → Appreciative + open-minded
- Negative (low/medium intensity) → Empathetic + reassuring
- High emotional intensity → Extra empathy, no defense

────────────────────────────────────
FAIL-SAFE CONDITIONS
────────────────────────────────────

If feedback involves:
- Payment disputes
- Refund requests
- Aggressive language
- Legal or policy threats

Then output:
"ESCALATE_TO_ADMIN"

Do NOT generate a reply in those cases.

────────────────────────────────────
SUCCESS CRITERIA
────────────────────────────────────

The user should feel:
• Heard
• Respected
• Taken seriously
• Not dismissed`;

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK REPLY GENERATOR SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class FeedbackReplyGenerator {
    /**
     * Generate AI reply for customer feedback
     */
    async generateReply(
        feedbackText: string,
        analysis: FeedbackAnalysisResult
    ): Promise<ReplyGenerationResult> {
        // Check for escalation conditions first
        const escalationCheck = this.checkEscalationConditions(feedbackText, analysis);
        if (escalationCheck.shouldEscalate) {
            return {
                reply: '',
                escalate: true,
                escalationReason: escalationCheck.reason,
                tone: 'neutral'
            };
        }

        // Determine tone based on sentiment and intensity
        const tone = this.determineTone(analysis);

        // Build context for AI
        const context = this.buildContext(feedbackText, analysis);

        try {
            // Call OpenRouter to generate reply
            const response = await openRouterClient.chat({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: context }
                ],
                functions: [
                    {
                        name: 'generate_reply',
                        description: 'Generate customer feedback reply',
                        parameters: {
                            type: 'object',
                            properties: {
                                reply: {
                                    type: 'string',
                                    description: 'The reply text (2-4 sentences, professional, empathetic)'
                                },
                                shouldEscalate: {
                                    type: 'boolean',
                                    description: 'True if feedback requires admin review (payment, refund, aggressive)'
                                }
                            },
                            required: ['reply', 'shouldEscalate']
                        }
                    }
                ],
                function_call: { name: 'generate_reply' },
                temperature: 0.7,
                max_tokens: 200
            });

            const functionCall = response.choices[0]?.message?.function_call;
            if (!functionCall) {
                throw new Error('No function call in OpenRouter response');
            }

            const result = JSON.parse(functionCall.arguments);

            // Check if AI flagged for escalation
            if (result.shouldEscalate || result.reply === 'ESCALATE_TO_ADMIN') {
                return {
                    reply: '',
                    escalate: true,
                    escalationReason: 'AI detected high-risk content requiring admin review',
                    tone
                };
            }

            // Validate reply
            this.validateReply(result.reply);

            return {
                reply: result.reply,
                escalate: false,
                tone
            };

        } catch (error) {
            console.error('[FeedbackReplyGenerator] Error:', error);

            // Fallback: escalate on error
            return {
                reply: '',
                escalate: true,
                escalationReason: 'AI reply generation failed - requires manual review',
                tone: 'neutral'
            };
        }
    }

    /**
     * Check for escalation conditions before AI generation
     */
    private checkEscalationConditions(
        feedbackText: string,
        analysis: FeedbackAnalysisResult
    ): { shouldEscalate: boolean; reason?: string } {
        const lowerText = feedbackText.toLowerCase();

        // Payment/refund keywords
        const paymentKeywords = ['refund', 'money back', 'charge', 'payment', 'paid', 'billing'];
        if (paymentKeywords.some(keyword => lowerText.includes(keyword))) {
            return {
                shouldEscalate: true,
                reason: 'Payment or refund request detected - requires admin review'
            };
        }

        // Legal/threat keywords
        const legalKeywords = ['lawyer', 'legal', 'sue', 'court', 'complaint', 'report'];
        if (legalKeywords.some(keyword => lowerText.includes(keyword))) {
            return {
                shouldEscalate: true,
                reason: 'Legal threat or formal complaint detected - requires admin review'
            };
        }

        // Aggressive language
        const aggressiveKeywords = ['worst', 'terrible', 'horrible', 'disgusting', 'pathetic', 'ridiculous'];
        const aggressiveCount = aggressiveKeywords.filter(keyword => lowerText.includes(keyword)).length;
        if (aggressiveCount >= 2) {
            return {
                shouldEscalate: true,
                reason: 'Aggressive language detected - requires admin review'
            };
        }

        // High emotional intensity
        if (analysis.emotionalIntensity === 'High' && analysis.priorityLevel === 'Urgent') {
            return {
                shouldEscalate: true,
                reason: 'High emotional intensity with urgent priority - requires admin review'
            };
        }

        // Payment issue intent
        if (analysis.userIntent.includes('Payment Issue')) {
            return {
                shouldEscalate: true,
                reason: 'Payment issue detected - requires admin review'
            };
        }

        return { shouldEscalate: false };
    }

    /**
     * Determine reply tone based on analysis
     */
    private determineTone(analysis: FeedbackAnalysisResult): 'warm' | 'appreciative' | 'empathetic' | 'neutral' {
        if (analysis.overallSentiment === 'Positive') {
            return 'warm';
        }

        if (analysis.userIntent.includes('Suggestion') || analysis.userIntent.includes('Feature Request')) {
            return 'appreciative';
        }

        if (analysis.overallSentiment === 'Negative' || analysis.emotionalIntensity === 'High') {
            return 'empathetic';
        }

        return 'neutral';
    }

    /**
     * Build context string for AI
     */
    private buildContext(feedbackText: string, analysis: FeedbackAnalysisResult): string {
        return `Feedback Text: "${feedbackText}"

Analysis:
- Sentiment: ${analysis.overallSentiment}
- Intent: ${analysis.userIntent.join(', ')}
- Emotional Intensity: ${analysis.emotionalIntensity}
- Priority: ${analysis.priorityLevel}

Generate a professional, empathetic reply following all response rules.`;
    }

    /**
     * Validate generated reply
     */
    private validateReply(reply: string): void {
        if (!reply || reply.trim().length === 0) {
            throw new Error('Reply cannot be empty');
        }

        if (reply.length > 500) {
            throw new Error('Reply too long (max 500 characters)');
        }

        // Check for forbidden phrases
        const forbiddenPhrases = [
            'we will fix',
            'immediately',
            'refund',
            'compensation',
            'guarantee',
            'promise',
            'AI',
            'artificial intelligence',
            'internal process'
        ];

        const lowerReply = reply.toLowerCase();
        for (const phrase of forbiddenPhrases) {
            if (lowerReply.includes(phrase)) {
                throw new Error(`Reply contains forbidden phrase: "${phrase}"`);
            }
        }
    }
}

// Singleton instance
export const feedbackReplyGenerator = new FeedbackReplyGenerator();
