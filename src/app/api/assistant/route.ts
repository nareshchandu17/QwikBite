import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { MenuItem } from '@/models/menuItem.model';
import { Order } from '@/models/order.model';
import AIInteraction from '@/models/ai-interaction.model';
import { successResponse, errorResponse } from '@/lib/api-response';
import logger from '@/lib/logger';
import RateLimiter from '@/lib/middleware/rateLimiter';
import { orchestrateAssistant } from '@/lib/ai/orchestration-controller';

// 🛡️ Strict AI Rate Limiter: 5 requests per minute to control costs
const aiLimiter = RateLimiter.getInstance(5, 60 * 1000);

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    
    try {
        // 1. Rate Limiting Check
        const rateLimit = aiLimiter.isAllowed(req);
        if (!rateLimit.allowed) {
            return errorResponse('AI Assistant is busy. Please try again in a minute.', 429, 'RATE_LIMIT_EXCEEDED');
        }

        // 2. Authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return errorResponse('Please sign in to use the assistant', 401, 'UNAUTHORIZED');
        }

        const userId = (session.user as { id?: string; _id?: string }).id || (session.user as { id?: string; _id?: string })._id;

        // 3. Database & Input
        await connectDB();
        const body = await req.json().catch(() => ({}));
        const userMessage = body.message?.trim();

        if (!userMessage) {
            return errorResponse('Message is required', 400, 'INVALID_INPUT');
        }

        const pageContext = body.pageContext || { currentPage: 'unknown', route: '/' };
        const userState = body.userState || { userId, role: 'customer', cartItems: [], activeOrderId: undefined };

        // 4. Orchestrate AI Response (The Professional Pipeline)
        console.log(`[API /assistant] Orchestrating response for user: ${userId}`);
        const assistantResponse = await orchestrateAssistant({
            message: userMessage,
            pageContext: pageContext,
            userState: {
                ...userState,
                userId: userId // Ensure correct ID
            }
        });

        // 5. Async Logging (non-blocking)
        const responseTime = Date.now() - startTime;
        logInteraction(userId as string, userMessage, assistantResponse, pageContext, responseTime);

        return successResponse(assistantResponse);

    } catch (error) {
        logger.error('AI Assistant Critical Failure', error);
        
        // Fallback response for production stability
        return successResponse({
            type: 'info',
            message: 'I\'m having trouble reaching my brain right now, but I can still help you navigate! What would you like to do?',
            buttons: [
                { label: 'View Menu', action: 'navigate', params: { page: 'menu' }, variant: 'primary' },
                { label: 'Track Order', action: 'navigate', params: { page: 'live-status' } },
                { label: 'Popular Items', action: 'popular' }
            ],
            timestamp: new Date()
        });
    }
}

/**
 * Background Logging Utility
 */
async function logInteraction(userId: string, message: string, response: unknown, context: unknown, latency: number) {
    const res = response as { type?: string; message?: string };
    try {
        let intent = 'general_help';
        if (message.match(/menu|food|items/i)) intent = 'browse_menu';
        else if (message.match(/order|track|status/i)) intent = 'check_order_status';
        else if (message.match(/popular|recommend/i)) intent = 'recommend_popular';

        await AIInteraction.create({
            userId,
            message,
            intent,
            pageContext: context,
            result: res.type === 'error' ? 'error' : 'success',
            actionTaken: res.type,
            responseTime: latency,
        });
        
        logger.debug(`AI Interaction Logged: ${intent} (${latency}ms)`);
    } catch (err) {
        logger.warn('Failed to log AI interaction', err);
    }
}

export async function OPTIONS() {
    return successResponse({});
}
