import { UserIntent, ActionResult, EnrichedContext } from '../types';
import * as recommendations from './recommendations';
import * as cartOps from './cart-operations';
import * as slotOps from './slot-operations';
import * as orderOps from './order-operations';
import * as feedbackOps from './feedback-operations';
import * as adminOps from './admin-operations';

/**
 * Function registry mapping intents to domain functions
 */
type DomainFunction = (params: unknown, context: EnrichedContext) => Promise<ActionResult>;

const FUNCTION_REGISTRY: Partial<Record<UserIntent, DomainFunction>> = {
    // Menu & Discovery
    [UserIntent.RECOMMEND_FAST_ITEM]: async (params, context) => {
        const p = params as { maxPrepTime?: number };
        const result = await recommendations.getRecommendations(
            { maxPrepTime: p.maxPrepTime || 15, sortBy: 'prepTime' },
            context
        );
        return {
            success: true,
            data: result,
            message: `Found ${result.items.length} fast options`,
            buttons: result.items.map(item => ({
                label: `${item.name} (₹${item.price}, ${item.prepTime}min)`,
                action: 'add_to_cart',
                params: { itemId: item.id, quantity: 1 },
                variant: 'primary' as const
            }))
        };
    },

    [UserIntent.RECOMMEND_HEALTHY]: async (params, context) => {
        const result = await recommendations.getRecommendations(
            { dietary: ['vegetarian', 'vegan'], sortBy: 'popularity' },
            context
        );
        return {
            success: true,
            data: result,
            message: `Found ${result.items.length} healthy options`,
            buttons: result.items.map(item => ({
                label: `${item.name} (₹${item.price})`,
                action: 'add_to_cart',
                params: { itemId: item.id, quantity: 1 }
            }))
        };
    },

    [UserIntent.RECOMMEND_POPULAR]: async (params, context) => {
        const result = await recommendations.getRecommendations(
            { sortBy: 'popularity' },
            context
        );
        return {
            success: true,
            data: result,
            message: `Top ${result.items.length} popular items`,
            buttons: result.items.map(item => ({
                label: `${item.name} (₹${item.price})`,
                action: 'add_to_cart',
                params: { itemId: item.id, quantity: 1 }
            }))
        };
    },

    [UserIntent.SEARCH_ITEM]: async (params, context) => {
        const p = params as { query: string };
        const result = await recommendations.searchMenuItems(p.query, context);
        return {
            success: true,
            data: result,
            message: result.items.length > 0 ? `Found ${result.items.length} items` : 'No items found',
            buttons: result.items.slice(0, 3).map(item => ({
                label: `${item.name} (₹${item.price})`,
                action: 'add_to_cart',
                params: { itemId: item.id, quantity: 1 }
            }))
        };
    },

    [UserIntent.CHECK_AVAILABILITY]: async (params, context) => {
        const p = params as { itemName: string };
        const result = await recommendations.checkAvailability(p.itemName, context);
        return {
            success: result.available,
            data: result,
            message: result.message,
            buttons: result.available && result.item ? [{
                label: 'Add to Cart',
                action: 'add_to_cart',
                params: { itemId: result.item.id, quantity: 1 },
                variant: 'primary' as const
            }] : []
        };
    },

    // Cart Operations
    [UserIntent.ADD_TO_CART]: async (params, context) => {
        const result = await cartOps.addToCart(params as any, context);
        return {
            success: true,
            data: result,
            message: result.message,
            uiDirective: {
                action: 'refresh' as const,
                target: 'cart'
            },
            buttons: [{
                label: 'View Cart',
                action: 'navigate',
                params: { page: 'order-summary' },
                variant: 'primary' as const
            }]
        };
    },

    [UserIntent.MODIFY_CART]: async (params, context) => {
        const result = await cartOps.modifyCart(params as any, context);
        return {
            success: true,
            data: result,
            message: result.message,
            uiDirective: {
                action: 'refresh' as const,
                target: 'cart'
            }
        };
    },

    [UserIntent.CLEAR_CART]: async (params, context) => {
        const result = await cartOps.clearCart(context);
        return {
            success: true,
            data: result,
            message: result.message,
            uiDirective: {
                action: 'refresh' as const,
                target: 'cart'
            }
        };
    },

    // Slot Operations
    [UserIntent.SELECT_SLOT]: async (params, context) => {
        const result = await slotOps.selectSlot(params as any, context);
        return {
            success: true,
            data: result,
            message: result.message,
            buttons: [{
                label: 'Confirm Order',
                action: 'confirm_order',
                params: { slotId: result.slot.id },
                variant: 'primary' as const
            }]
        };
    },

    // Order Operations
    [UserIntent.CHECK_ORDER_STATUS]: async (params, context) => {
        const result = await orderOps.getOrderStatus(params as any, context);
        return {
            success: true,
            data: result,
            message: result.message,
            buttons: result.order.status === 'pending' || result.order.status === 'confirmed' ? [{
                label: 'Cancel Order',
                action: 'cancel_order',
                params: { orderId: result.order.id },
                variant: 'danger' as const
            }] : []
        };
    },

    [UserIntent.CANCEL_ORDER]: async (params, context) => {
        const result = await orderOps.cancelOrder(params as any, context);
        return {
            success: result.success,
            data: result,
            message: result.message,
            uiDirective: {
                action: 'navigate' as const,
                target: 'menu'
            }
        };
    },

    [UserIntent.ESTIMATE_WAIT_TIME]: async (params, context) => {
        const result = await orderOps.estimateWaitTime(params as any, context);
        return {
            success: true,
            data: result,
            message: result.message
        };
    },

    // Feedback Operations
    [UserIntent.GIVE_FEEDBACK]: async (params, context) => {
        const result = await feedbackOps.processFeedback(params as any, context);
        return {
            success: true,
            data: result,
            message: 'Thank you for your feedback!',
            uiDirective: result.adminAlerted ? {
                action: 'open_modal' as const,
                target: 'feedback_submitted'
            } : undefined
        };
    },

    [UserIntent.FILE_COMPLAINT]: async (params, context) => {
        const result = await feedbackOps.fileComplaint(params as any, context);
        return {
            success: true,
            data: result,
            message: 'Complaint filed. Admin will review shortly.'
        };
    },

    [UserIntent.REPORT_ISSUE]: async (params, context) => {
        const result = await feedbackOps.reportIssue(params as any, context);
        return {
            success: result.success,
            data: result,
            message: result.message
        };
    },

    // Admin Operations
    [UserIntent.ADMIN_RESPOND_FEEDBACK]: async (params, context) => {
        const result = await adminOps.respondToFeedback(params as any, context);
        return {
            success: result.success,
            data: result,
            message: result.message
        };
    },

    // General Help
    [UserIntent.GENERAL_HELP]: async (params, context) => {
        const currentPage = context.pageContext.currentPage;
        const suggestions = [];

        // Provide context-aware suggestions
        if (currentPage === 'menu') {
            suggestions.push(
                { label: 'Show popular items', action: 'recommend_popular' },
                { label: 'Find healthy options', action: 'recommend_healthy' },
                { label: 'Quick items (under 15 min)', action: 'recommend_fast' }
            );
        } else if (currentPage === 'order-summary') {
            suggestions.push(
                { label: 'Select pickup time', action: 'select_slot' },
                { label: 'View cart', action: 'view_cart' }
            );
        } else if (currentPage === 'live-status') {
            suggestions.push(
                { label: 'Check order status', action: 'check_order_status' },
                { label: 'Estimate wait time', action: 'estimate_wait_time' }
            );
        } else {
            suggestions.push(
                { label: 'Browse menu', action: 'navigate', params: { page: 'menu' } },
                { label: 'Track my order', action: 'check_order_status' },
                { label: 'View popular items', action: 'recommend_popular' }
            );
        }

        return {
            success: true,
            message: 'Here are some things I can help you with:',
            buttons: suggestions.map(s => ({
                label: s.label,
                action: s.action,
                params: s.params,
                variant: 'secondary' as const
            }))
        };
    }
};

/**
 * Execute intent by routing to appropriate domain function
 */
export async function executeIntent(
    intent: UserIntent,
    params: Record<string, unknown>,
    context: EnrichedContext
): Promise<ActionResult> {
    const fn = FUNCTION_REGISTRY[intent];

    if (!fn) {
        // No specific handler - return general help
        return {
            success: false,
            error: `No handler implemented for intent: ${intent}`,
            message: 'This action is not yet available',
            buttons: [{
                label: 'Browse Menu',
                action: 'navigate',
                params: { page: 'menu' }
            }]
        };
    }

    try {
        const result = await fn(params, context);
        return result;
    } catch (error) {
        console.error(`[Function Registry] Error executing ${intent}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: error instanceof Error ? error.message : 'An error occurred'
        };
    }
}
