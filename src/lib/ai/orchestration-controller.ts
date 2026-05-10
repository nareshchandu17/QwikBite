import {
    AssistantRequest,
    AssistantResponse,
    EnrichedContext,
    PageType
} from './types';
import { buildEnrichedContext } from './context-builder';
import { classifyIntent, extractParameters } from './intent-classifier';
import { validatePageContext, getSuggestedActions } from './page-validator';
import { executeIntent } from './functions/function-registry';
import {
    validateInput,
    validateAuthorization,
    validateState,
    rateLimiter,
    checkConfidence,
    sanitizeError,
    validateRequestSize,
    sanitizeLLMOutput
} from './safety-guardrails';

/**
 * Main AI Orchestration Controller
 * Processes user messages through the complete pipeline
 */
export async function orchestrateAssistant(
    request: AssistantRequest
): Promise<AssistantResponse> {
    const startTime = Date.now();

    try {
        // 1. VALIDATION & RATE LIMITING
        validateRequestSize(request);
        validateInput(request);

        const rateLimit = rateLimiter.check(request.userState.userId);
        if (!rateLimit.allowed) {
            return {
                type: 'error',
                message: 'Rate limit exceeded. Please wait a moment before trying again.',
                timestamp: new Date()
            };
        }

        // 2. CONTEXT INJECTION
        console.log('[Orchestrator] Building enriched context...');
        const context: EnrichedContext = await buildEnrichedContext(
            request.pageContext,
            request.userState
        );

        // 3. INTENT CLASSIFICATION
        console.log('[Orchestrator] Classifying intent...');
        let intentResult;
        try {
            intentResult = await classifyIntent(request.message, context);
            console.log('[Orchestrator] Intent:', intentResult.intent, `(${intentResult.confidence})`);
        } catch (error) {
            console.error('[Orchestrator] Intent classification failed:', error);

            // Return a user-friendly error instead of throwing
            return {
                type: 'error',
                message: 'I\'m having trouble understanding your request right now. Please try rephrasing or try again in a moment.',
                buttons: [{
                    label: 'Try again',
                    action: 'retry'
                }],
                timestamp: new Date()
            };
        }

        // Check confidence threshold
        const confidenceCheck = checkConfidence(intentResult.confidence);
        if (confidenceCheck.needsClarification) {
            return {
                type: 'clarification',
                message: 'Could you clarify what you\'d like to do?',
                data: {
                    suggestions: getSuggestedActions(request.pageContext.currentPage)
                },
                buttons: getSuggestedActions(request.pageContext.currentPage).map(action => ({
                    label: action,
                    action: 'clarify',
                    params: { suggestion: action }
                })),
                timestamp: new Date()
            };
        }

        // 4. PAGE-AWARE VALIDATION
        console.log('[Orchestrator] Validating page context...');
        const pageValidation = validatePageContext(
            intentResult.intent,
            request.pageContext.currentPage
        );

        if (!pageValidation.valid && pageValidation.redirect) {
            return {
                type: 'redirect',
                message: pageValidation.redirect.reason,
                uiDirective: {
                    action: 'navigate',
                    target: pageValidation.redirect.page
                },
                buttons: [{
                    label: `Go to ${pageValidation.redirect.page}`,
                    action: 'navigate',
                    params: { page: pageValidation.redirect.page },
                    variant: 'primary'
                }],
                timestamp: new Date()
            };
        }

        // 5. AUTHORIZATION & STATE VALIDATION
        try {
            validateAuthorization(intentResult.intent, request.userState.role);
            validateState(intentResult.intent, request.userState);
        } catch (error) {
            return {
                type: 'error',
                message: sanitizeError(error),
                timestamp: new Date()
            };
        }

        // 6. PARAMETER EXTRACTION
        const params = {
            ...intentResult.extractedParams,
            ...extractParameters(intentResult.intent, request.message, context)
        };

        console.log('[Orchestrator] Extracted params:', params);

        // 7. FUNCTION EXECUTION
        console.log('[Orchestrator] Executing intent...');
        const actionResult = await executeIntent(intentResult.intent, params, context);

        // 8. RESPONSE FORMATTING
        const response: AssistantResponse = {
            type: actionResult.success ? 'action' : 'error',
            message: sanitizeLLMOutput(actionResult.message),
            data: sanitizeLLMOutput(actionResult.data),
            uiDirective: actionResult.uiDirective,
            buttons: actionResult.buttons,
            timestamp: new Date()
        };

        // 9. LOGGING (for analytics)
        const responseTime = Date.now() - startTime;
        console.log('[Orchestrator] Completed in', responseTime, 'ms');

        // TODO: Log to database for analytics
        // await logInteraction({
        //   userId: request.userState.userId,
        //   message: request.message,
        //   intent: intentResult.intent,
        //   confidence: intentResult.confidence,
        //   pageContext: request.pageContext,
        //   result: actionResult.success ? 'success' : 'error',
        //   responseTime
        // });

        return response;

    } catch (error) {
        console.error('[Orchestrator] Error:', error);

        // Check if it's an API key issue
        if (error instanceof Error && error.message.includes('OPENROUTER_API_KEY')) {
            return {
                type: 'error',
                message: 'AI service is not configured. Please contact support.',
                timestamp: new Date()
            };
        }

        // Check if it's an OpenRouter API error
        if (error instanceof Error && error.message.includes('OpenRouter API')) {
            return {
                type: 'error',
                message: 'AI service is temporarily unavailable. Please try again in a moment.',
                buttons: [{
                    label: 'Try again',
                    action: 'retry'
                }],
                timestamp: new Date()
            };
        }

        return {
            type: 'error',
            message: sanitizeError(error),
            buttons: [{
                label: 'Try again',
                action: 'retry'
            }],
            timestamp: new Date()
        };
    }
}

/**
 * Handle general help intent
 */
export function getGeneralHelp(currentPage: string): AssistantResponse {
    const suggestions = getSuggestedActions(currentPage as PageType);

    return {
        type: 'info',
        message: 'Here\'s what you can do:',
        data: { suggestions },
        buttons: suggestions.slice(0, 3).map(action => ({
            label: action,
            action: 'execute',
            params: { suggestion: action }
        })),
        timestamp: new Date()
    };
}
