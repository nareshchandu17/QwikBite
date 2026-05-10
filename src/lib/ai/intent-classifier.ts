import { UserIntent, IntentResult, EnrichedContext } from './types';
import { openRouterClient } from './openrouter-client';

/**
 * Rule-based intent classification patterns
 * Fast path for common, unambiguous intents
 */
const RULE_PATTERNS: Array<{
    pattern: RegExp;
    intent: UserIntent;
    confidence: number;
}> = [
        // Order status queries
        { pattern: /where('s| is) my order|order status|track.*order/i, intent: UserIntent.CHECK_ORDER_STATUS, confidence: 0.95 },
        { pattern: /cancel.*order|stop.*order/i, intent: UserIntent.CANCEL_ORDER, confidence: 0.9 },

        // Time-based recommendations
        { pattern: /quick|fast|hurry|urgent|(\d+)\s*min(ute)?s?|limited time/i, intent: UserIntent.RECOMMEND_FAST_ITEM, confidence: 0.9 },

        // Cart operations
        { pattern: /add.*cart|put.*cart/i, intent: UserIntent.ADD_TO_CART, confidence: 0.85 },
        { pattern: /clear.*cart|empty.*cart|remove all/i, intent: UserIntent.CLEAR_CART, confidence: 0.9 },
        { pattern: /update.*cart|change.*quantity|modify.*cart/i, intent: UserIntent.MODIFY_CART, confidence: 0.85 },

        // Slot selection
        { pattern: /select.*slot|choose.*time|pick.*slot|earliest.*slot/i, intent: UserIntent.SELECT_SLOT, confidence: 0.9 },

        // Feedback
        { pattern: /feedback|complain|issue|problem|report/i, intent: UserIntent.GIVE_FEEDBACK, confidence: 0.8 },

        // Payment
        { pattern: /payment|pay|refund/i, intent: UserIntent.PAYMENT_HELP, confidence: 0.8 },

        // Menu browsing
        { pattern: /show.*menu|browse|what.*available|see.*items/i, intent: UserIntent.BROWSE_MENU, confidence: 0.85 },
        { pattern: /healthy|nutrition|diet|veg(etarian)?/i, intent: UserIntent.RECOMMEND_HEALTHY, confidence: 0.85 },
        { pattern: /popular|best.*seller|recommend|suggest/i, intent: UserIntent.RECOMMEND_POPULAR, confidence: 0.8 }
    ];

/**
 * Check if user has active order in context
 */
function hasActiveOrder(context: EnrichedContext): boolean {
    return !!context.userState.activeOrderId || !!context.liveData.activeOrder;
}

/**
 * Check if user has items in cart
 */
function hasCartItems(context: EnrichedContext): boolean {
    return (context.userState.cartItems?.length ?? 0) > 0;
}

/**
 * Rule-based pre-filter for common patterns
 * Returns high-confidence result if pattern matches
 */
function checkRules(message: string, context: EnrichedContext): IntentResult | null {
    // Normalize message
    const normalized = message.toLowerCase().trim();

    // Check each pattern
    for (const { pattern, intent, confidence } of RULE_PATTERNS) {
        if (pattern.test(normalized)) {
            // Context-based confidence adjustment
            let adjustedConfidence = confidence;

            // Boost confidence if context aligns
            if (intent === UserIntent.CHECK_ORDER_STATUS && hasActiveOrder(context)) {
                adjustedConfidence = Math.min(1.0, confidence + 0.05);
            }
            if (intent === UserIntent.CANCEL_ORDER && !hasActiveOrder(context)) {
                adjustedConfidence = Math.max(0.5, confidence - 0.3); // Lower confidence if no active order
            }
            if (intent === UserIntent.CLEAR_CART && !hasCartItems(context)) {
                adjustedConfidence = Math.max(0.5, confidence - 0.3);
            }

            // Extract basic parameters
            const extractedParams: Record<string, unknown> = {};

            // Extract time constraints
            const timeMatch = normalized.match(/(\d+)\s*min(ute)?s?/);
            if (timeMatch && intent === UserIntent.RECOMMEND_FAST_ITEM) {
                extractedParams.maxPrepTime = parseInt(timeMatch[1]);
            }

            return {
                intent,
                confidence: adjustedConfidence,
                extractedParams,
                reasoning: 'Rule-based match'
            };
        }
    }

    return null;
}

/**
 * Build context string for LLM
 */
function buildContextString(context: EnrichedContext): string {
    const parts: string[] = [];

    parts.push(`Current page: ${context.pageContext.currentPage}`);
    parts.push(`User role: ${context.userState.role}`);

    if (context.liveData.activeOrder) {
        parts.push(`Active order: ${context.liveData.activeOrder.id} (${context.liveData.activeOrder.status})`);
    }

    if (context.userState.cartItems && context.userState.cartItems.length > 0) {
        parts.push(`Cart: ${context.userState.cartItems.length} items`);
    }

    if (context.liveData.availableSlots) {
        parts.push(`Available slots: ${context.liveData.availableSlots.length}`);
    }

    if (context.liveData.menuItems) {
        parts.push(`Menu items available: ${context.liveData.menuItems.filter(i => i.available).length}`);
    }

    return parts.join(', ');
}

/**
 * Hybrid intent classifier
 * Tries rule-based first, falls back to LLM
 */
export async function classifyIntent(
    message: string,
    context: EnrichedContext
): Promise<IntentResult> {
    // 1. Try rule-based classification first (fast path)
    const ruleResult = checkRules(message, context);
    if (ruleResult && ruleResult.confidence >= 0.85) {
        console.log('[Intent Classifier] Rule-based match:', ruleResult.intent, `(${ruleResult.confidence})`);
        return ruleResult;
    }

    // 2. Fall back to LLM classification
    try {
        console.log('[Intent Classifier] Using LLM classification');
        const contextString = buildContextString(context);
        const llmResult = await openRouterClient.classifyIntent(message, contextString);

        console.log('[Intent Classifier] LLM result:', llmResult.intent, `(${llmResult.confidence})`);

        return {
            ...llmResult,
            reasoning: 'LLM classification'
        };
    } catch (error) {
        console.error('[Intent Classifier] LLM classification failed:', error);

        // Log the specific error for debugging
        if (error instanceof Error) {
            console.error('[Intent Classifier] Error details:', {
                message: error.message,
                name: error.name
            });
        }

        // 3. Fallback: return rule result if available, otherwise GENERAL_HELP
        if (ruleResult) {
            console.log('[Intent Classifier] Falling back to rule result with lower confidence');
            return {
                ...ruleResult,
                confidence: Math.max(0.5, ruleResult.confidence - 0.2), // Lower confidence since LLM failed
                reasoning: 'Rule-based fallback (LLM unavailable)'
            };
        }

        // If no rule match and LLM failed, return GENERAL_HELP instead of UNCLEAR
        console.log('[Intent Classifier] No rule match, returning GENERAL_HELP');
        return {
            intent: UserIntent.GENERAL_HELP,
            confidence: 0.6,
            extractedParams: {},
            reasoning: 'LLM failed, no rule match - showing general help'
        };
    }
}

/**
 * Extract specific parameters based on intent
 */
export function extractParameters(
    intent: UserIntent,
    message: string,
    context: EnrichedContext
): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    const normalized = message.toLowerCase();

    switch (intent) {
        case UserIntent.RECOMMEND_FAST_ITEM:
            // Extract time constraint
            const timeMatch = normalized.match(/(\d+)\s*min(ute)?s?/);
            if (timeMatch) {
                params.maxPrepTime = parseInt(timeMatch[1]);
            } else {
                params.maxPrepTime = 15; // Default
            }
            break;

        case UserIntent.ADD_TO_CART:
            // Try to extract item name
            // This is basic - LLM does better job
            const addMatch = normalized.match(/add\s+(.+?)\s+to\s+cart/i);
            if (addMatch) {
                params.itemName = addMatch[1].trim();
            }
            break;

        case UserIntent.SEARCH_ITEM:
            // Extract search query
            const searchMatch = normalized.match(/search|find|look for\s+(.+)/i);
            if (searchMatch) {
                params.query = searchMatch[1].trim();
            }
            break;

        case UserIntent.RECOMMEND_HEALTHY:
            params.dietary = ['vegetarian', 'low-calorie'];
            break;

        case UserIntent.SELECT_SLOT:
            // Check if user wants earliest
            if (normalized.includes('earliest') || normalized.includes('soonest')) {
                params.preference = 'earliest';
            }
            break;
    }

    return params;
}
