import { UserIntent, PageType, PageValidationResult } from './types';

/**
 * Mapping of pages to allowed intents
 * This enforces page-aware behavior
 */
const PAGE_ALLOWED_INTENTS: Record<PageType, UserIntent[]> = {
    menu: [
        UserIntent.BROWSE_MENU,
        UserIntent.RECOMMEND_FAST_ITEM,
        UserIntent.RECOMMEND_HEALTHY,
        UserIntent.RECOMMEND_POPULAR,
        UserIntent.SEARCH_ITEM,
        UserIntent.CHECK_AVAILABILITY,
        UserIntent.ADD_TO_CART,
        UserIntent.CHECK_ORDER_STATUS, // Allow checking status from anywhere
        UserIntent.GENERAL_HELP
    ],

    'order-summary': [
        UserIntent.MODIFY_CART,
        UserIntent.CLEAR_CART,
        UserIntent.SELECT_SLOT,
        UserIntent.CONFIRM_ORDER,
        UserIntent.CHECK_ORDER_STATUS,
        UserIntent.GENERAL_HELP
    ],

    'live-status': [
        UserIntent.CHECK_ORDER_STATUS,
        UserIntent.CANCEL_ORDER,
        UserIntent.ESTIMATE_WAIT_TIME,
        UserIntent.GENERAL_HELP
    ],

    feedback: [
        UserIntent.GIVE_FEEDBACK,
        UserIntent.FILE_COMPLAINT,
        UserIntent.REPORT_ISSUE,
        UserIntent.CHECK_ORDER_STATUS,
        UserIntent.GENERAL_HELP
    ],

    payment: [
        UserIntent.PAYMENT_HELP,
        UserIntent.REFUND_STATUS,
        UserIntent.CHECK_ORDER_STATUS,
        UserIntent.GENERAL_HELP
    ],

    admin: [
        UserIntent.ADMIN_VIEW_ANALYTICS,
        UserIntent.ADMIN_RESPOND_FEEDBACK,
        UserIntent.CHECK_ORDER_STATUS,
        UserIntent.GENERAL_HELP
    ],

    unknown: [
        UserIntent.GENERAL_HELP,
        UserIntent.CHECK_ORDER_STATUS
    ]
};

/**
 * Mapping of intents to their primary page
 * Used for redirect suggestions
 */
const INTENT_PRIMARY_PAGE: Partial<Record<UserIntent, PageType>> = {
    [UserIntent.BROWSE_MENU]: 'menu',
    [UserIntent.RECOMMEND_FAST_ITEM]: 'menu',
    [UserIntent.RECOMMEND_HEALTHY]: 'menu',
    [UserIntent.RECOMMEND_POPULAR]: 'menu',
    [UserIntent.SEARCH_ITEM]: 'menu',
    [UserIntent.CHECK_AVAILABILITY]: 'menu',
    [UserIntent.ADD_TO_CART]: 'menu',

    [UserIntent.MODIFY_CART]: 'order-summary',
    [UserIntent.CLEAR_CART]: 'order-summary',
    [UserIntent.SELECT_SLOT]: 'order-summary',
    [UserIntent.CONFIRM_ORDER]: 'order-summary',

    [UserIntent.CHECK_ORDER_STATUS]: 'live-status',
    [UserIntent.CANCEL_ORDER]: 'live-status',
    [UserIntent.ESTIMATE_WAIT_TIME]: 'live-status',

    [UserIntent.GIVE_FEEDBACK]: 'feedback',
    [UserIntent.FILE_COMPLAINT]: 'feedback',
    [UserIntent.REPORT_ISSUE]: 'feedback',

    [UserIntent.PAYMENT_HELP]: 'payment',
    [UserIntent.REFUND_STATUS]: 'payment'
};

/**
 * Validate if an intent is allowed on the current page
 */
export function validatePageContext(
    intent: UserIntent,
    currentPage: PageType
): PageValidationResult {
    // Always allow UNCLEAR and GENERAL_HELP
    if (intent === UserIntent.UNCLEAR || intent === UserIntent.GENERAL_HELP) {
        return { valid: true };
    }

    // Get allowed intents for current page
    const allowedIntents = PAGE_ALLOWED_INTENTS[currentPage] || [];

    // Check if intent is allowed
    if (allowedIntents.includes(intent)) {
        return { valid: true };
    }

    // Intent not allowed - suggest redirect
    const correctPage = INTENT_PRIMARY_PAGE[intent];

    if (correctPage) {
        return {
            valid: false,
            redirect: {
                page: correctPage,
                reason: getRedirectReason(intent, correctPage)
            }
        };
    }

    // No specific page for this intent
    return {
        valid: false,
        redirect: {
            page: 'menu',
            reason: 'This action is not available on the current page'
        }
    };
}

/**
 * Generate human-readable redirect reason
 */
function getRedirectReason(intent: UserIntent, targetPage: PageType): string {
    const pageNames: Record<PageType, string> = {
        menu: 'Menu',
        'order-summary': 'Order Summary',
        'live-status': 'Live Status',
        feedback: 'Feedback',
        payment: 'Payment',
        admin: 'Admin Dashboard',
        unknown: 'Home'
    };

    const intentActions: Partial<Record<UserIntent, string>> = {
        [UserIntent.ADD_TO_CART]: 'add items to cart',
        [UserIntent.BROWSE_MENU]: 'browse menu',
        [UserIntent.CANCEL_ORDER]: 'cancel your order',
        [UserIntent.CHECK_ORDER_STATUS]: 'check order status',
        [UserIntent.SELECT_SLOT]: 'select a pickup slot',
        [UserIntent.GIVE_FEEDBACK]: 'submit feedback',
        [UserIntent.PAYMENT_HELP]: 'get payment help'
    };

    const action = intentActions[intent] || 'perform this action';
    const page = pageNames[targetPage] || targetPage;

    return `To ${action}, navigate to the ${page} page`;
}

/**
 * Get suggested next actions for a page
 */
export function getSuggestedActions(currentPage: PageType): string[] {
    const suggestions: Record<PageType, string[]> = {
        menu: [
            'Browse menu items',
            'Get fast recommendations',
            'Search for specific items',
            'Add items to cart'
        ],
        'order-summary': [
            'Review your cart',
            'Select pickup slot',
            'Confirm your order',
            'Modify cart items'
        ],
        'live-status': [
            'Check order status',
            'View estimated wait time',
            'Cancel order'
        ],
        feedback: [
            'Submit feedback',
            'Report an issue',
            'File a complaint'
        ],
        payment: [
            'Complete payment',
            'Check refund status',
            'Get payment help'
        ],
        admin: [
            'View analytics',
            'Respond to feedback',
            'Manage orders'
        ],
        unknown: [
            'Navigate to menu',
            'Check order status'
        ]
    };

    return suggestions[currentPage] || suggestions.unknown;
}
