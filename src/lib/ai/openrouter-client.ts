import { UserIntent } from './types';

/**
 * OpenRouter API client for LLM interactions
 * Uses GPT-4 Turbo with function calling support
 */

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
    name?: string;
}

interface OpenRouterFunction {
    name: string;
    description?: string;
    parameters: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}

interface OpenRouterRequest {
    model?: string;
    messages: OpenRouterMessage[];
    functions?: OpenRouterFunction[];
    function_call?: { name: string } | 'auto' | 'none';
    temperature?: number;
    max_tokens?: number;
}

interface OpenRouterResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string | null;
            function_call?: {
                name: string;
                arguments: string;
            };
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

class OpenRouterClient {
    private apiKey: string;
    private baseUrl = 'https://openrouter.ai/api/v1';
    private model = 'openai/gpt-4-turbo';
    private maxRetries = 3;
    private retryDelay = 1000; // ms

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY || '';
        if (!this.apiKey) {
            console.error('[OpenRouterClient] OPENROUTER_API_KEY not found in environment variables');
            console.error('[OpenRouterClient] Please add OPENROUTER_API_KEY to your .env file');
        } else {
            console.log('[OpenRouterClient] API key loaded successfully (length:', this.apiKey.length, ')');
        }
    }

    /**
     * Make a chat completion request with retry logic
     */
    async chat(request: OpenRouterRequest): Promise<OpenRouterResponse> {
        // Validate API key before making request
        if (!this.apiKey) {
            const errorMsg = 'OPENROUTER_API_KEY is not configured. Please add it to your .env file and restart the server.';
            console.error('[OpenRouterClient]', errorMsg);
            throw new Error(errorMsg);
        }

        console.log('[OpenRouterClient] Making request to OpenRouter API...');
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                console.log(`[OpenRouterClient] Attempt ${attempt + 1}/${this.maxRetries}`);

                const response = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
                        'X-Title': 'qwikBite AI Assistant'
                    },
                    body: JSON.stringify({
                        ...request,
                        model: this.model
                    })
                });

                console.log('[OpenRouterClient] Response status:', response.status, response.statusText);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('[OpenRouterClient] API error response:', errorData);
                    throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
                }

                const data: OpenRouterResponse = await response.json();
                console.log('[OpenRouterClient] Request successful');
                return data;

            } catch (error) {
                lastError = error as Error;
                console.error(`[OpenRouterClient] Attempt ${attempt + 1} failed:`, error);

                // Don't retry on authentication errors
                if (error instanceof Error && error.message.includes('401')) {
                    console.error('[OpenRouterClient] Authentication failed - check your API key');
                    throw error;
                }

                // Wait before retrying (exponential backoff)
                if (attempt < this.maxRetries - 1) {
                    const delay = this.retryDelay * Math.pow(2, attempt);
                    console.log(`[OpenRouterClient] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        const finalError = `OpenRouter API failed after ${this.maxRetries} attempts: ${lastError?.message}`;
        console.error('[OpenRouterClient]', finalError);
        throw new Error(finalError);
    }

    /**
     * Classify intent using function calling
     */
    async classifyIntent(
        userMessage: string,
        context: string
    ): Promise<{ intent: UserIntent; confidence: number; extractedParams: Record<string, unknown> }> {
        const systemPrompt = `You are the intent classification engine for qwikBite, a campus food ordering system.

Your ONLY job is to classify user messages into predefined intents.

RULES:
1. Output ONLY the function call, no prose
2. Use ONLY intents from the provided enum
3. Extract parameters strictly from user message
4. If unclear, use intent: "unclear" with confidence < 0.5
5. Consider page context (user can't add to cart on payment page)

CONTEXT PROVIDED:
- Current page
- User's cart state
- Active order (if any)
- Available slots
- Current time

DO NOT:
- Generate conversational responses
- Make assumptions about user preferences
- Hallucinate data not in context

CONFIDENCE SCORING:
- 0.9-1.0: Explicit keyword match + context alignment
- 0.7-0.9: Clear intent, minor ambiguity
- 0.5-0.7: Probable intent, needs confirmation
- <0.5: Unclear, requires user clarification`;

        const response = await this.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Context: ${context}\n\nUser message: "${userMessage}"` }
            ],
            functions: [
                {
                    name: 'classify_intent',
                    description: 'Classify user intent and extract parameters',
                    parameters: {
                        type: 'object',
                        properties: {
                            intent: {
                                type: 'string',
                                enum: Object.values(UserIntent)
                            },
                            confidence: {
                                type: 'number',
                                minimum: 0,
                                maximum: 1
                            },
                            extractedParams: {
                                type: 'object',
                                description: 'Parameters extracted from user message (e.g., item names, quantities, time constraints)'
                            }
                        },
                        required: ['intent', 'confidence']
                    }
                }
            ],
            function_call: { name: 'classify_intent' },
            temperature: 0.3,
            max_tokens: 200
        });

        const functionCall = response.choices[0]?.message?.function_call;
        if (!functionCall) {
            throw new Error('No function call in OpenRouter response');
        }

        const result = JSON.parse(functionCall.arguments);
        return {
            intent: result.intent as UserIntent,
            confidence: result.confidence,
            extractedParams: result.extractedParams || {}
        };
    }

    /**
     * Classify feedback sentiment and generate response
     */
    async classifyFeedback(
        feedbackText: string,
        rating: number
    ): Promise<{
        sentiment: 'positive' | 'neutral' | 'negative';
        category: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        suggestedResponse: string;
        tags: string[];
    }> {
        const systemPrompt = `You are a feedback classification system for qwikBite.

Analyze feedback and provide:
1. Sentiment (positive/neutral/negative)
2. Category (food_quality, service, pricing, delivery, hygiene, other)
3. Severity (low, medium, high, critical)
4. Suggested response (professional, empathetic, actionable)
5. Tags (specific issues mentioned)

Be concise and operational. Focus on actionable insights.`;

        const response = await this.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Rating: ${rating}/5\nFeedback: "${feedbackText}"` }
            ],
            functions: [
                {
                    name: 'classify_feedback',
                    parameters: {
                        type: 'object',
                        properties: {
                            sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
                            category: { type: 'string', enum: ['food_quality', 'service', 'pricing', 'delivery', 'hygiene', 'other'] },
                            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                            suggestedResponse: { type: 'string' },
                            tags: { type: 'array', items: { type: 'string' } }
                        },
                        required: ['sentiment', 'category', 'severity', 'suggestedResponse', 'tags']
                    }
                }
            ],
            function_call: { name: 'classify_feedback' },
            temperature: 0.4,
            max_tokens: 300
        });

        const functionCall = response.choices[0]?.message?.function_call;
        if (!functionCall) {
            throw new Error('No function call in OpenRouter response');
        }

        return JSON.parse(functionCall.arguments);
    }
}

// Singleton instance
export const openRouterClient = new OpenRouterClient();
