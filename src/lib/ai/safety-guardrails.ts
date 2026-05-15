import { z } from 'zod';
import { AssistantRequestSchema, UserIntent, UserRole } from './types';

/**
 * Rate limiter using in-memory store
 * In production, use Redis or similar
 */
class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private windowMs: number;
    private maxRequests: number;

    constructor(windowMs: number = 60000, maxRequests: number = 20) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    check(userId: string): { allowed: boolean; remaining: number } {
        const now = Date.now();
        const userRequests = this.requests.get(userId) || [];

        // Filter out old requests
        const recentRequests = userRequests.filter(time => now - time < this.windowMs);

        if (recentRequests.length >= this.maxRequests) {
            return { allowed: false, remaining: 0 };
        }

        // Add current request
        recentRequests.push(now);
        this.requests.set(userId, recentRequests);

        return {
            allowed: true,
            remaining: this.maxRequests - recentRequests.length
        };
    }

    reset(userId: string) {
        this.requests.delete(userId);
    }
}

// Singleton rate limiter
export const rateLimiter = new RateLimiter(60000, 20); // 20 req/min

/**
 * Input validation
 */
export function validateInput(data: unknown) {
    try {
        return AssistantRequestSchema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(`Invalid request: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
    }
}

/**
 * Authorization check for admin-only intents
 */
export function validateAuthorization(intent: UserIntent, userRole: UserRole): void {
    const adminOnlyIntents = [
        UserIntent.ADMIN_VIEW_ANALYTICS,
        UserIntent.ADMIN_RESPOND_FEEDBACK
    ];

    if (adminOnlyIntents.includes(intent) && userRole !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
    }
}

/**
 * State validation for intent
 */
export function validateState(
    intent: UserIntent,
    userState: { activeOrderId?: string; cartItems?: unknown[] }
): void {
    switch (intent) {
        case UserIntent.CANCEL_ORDER:
        case UserIntent.CHECK_ORDER_STATUS:
        case UserIntent.ESTIMATE_WAIT_TIME:
            if (!userState.activeOrderId) {
                throw new Error('No active order found');
            }
            break;

        case UserIntent.CLEAR_CART:
        case UserIntent.MODIFY_CART:
            if (!userState.cartItems || userState.cartItems.length === 0) {
                throw new Error('Cart is empty');
            }
            break;

        case UserIntent.CONFIRM_ORDER:
            if (!userState.cartItems || userState.cartItems.length === 0) {
                throw new Error('Cannot confirm order with empty cart');
            }
            break;
    }
}

/**
 * Sanitize LLM output to prevent injection
 */
export function sanitizeLLMOutput(output: unknown): unknown {
    if (typeof output === 'string') {
        // Remove potential script tags or dangerous content
        return output
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .trim()
            .slice(0, 2000); // Max 2000 chars
    }

    if (typeof output === 'object' && output !== null) {
        const sanitized: any = Array.isArray(output) ? [] : {};
        for (const [key, value] of Object.entries(output)) {
            sanitized[key] = sanitizeLLMOutput(value);
        }
        return sanitized;
    }

    return output;
}

/**
 * Confidence threshold check
 */
export const CONFIDENCE_THRESHOLD = 0.7;

export function checkConfidence(confidence: number): {
    acceptable: boolean;
    needsClarification: boolean;
} {
    return {
        acceptable: confidence >= CONFIDENCE_THRESHOLD,
        needsClarification: confidence < CONFIDENCE_THRESHOLD
    };
}

/**
 * Error sanitization for user-facing messages
 */
export function sanitizeError(error: unknown): string {
    if (error instanceof Error) {
        // Don't expose internal errors
        if (error.message.includes('MongoDB') || error.message.includes('database')) {
            return 'A database error occurred. Please try again.';
        }
        if (error.message.includes('OpenRouter') || error.message.includes('API')) {
            return 'AI service temporarily unavailable. Please try again.';
        }
        return error.message;
    }
    return 'An unexpected error occurred';
}

/**
 * Request size validation
 */
export function validateRequestSize(data: unknown): void {
    const size = JSON.stringify(data).length;
    const MAX_SIZE = 10000; // 10KB

    if (size > MAX_SIZE) {
        throw new Error('Request too large');
    }
}
