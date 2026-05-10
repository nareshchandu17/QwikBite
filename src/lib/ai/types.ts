import { z } from 'zod';

/**
 * Finite set of user intents supported by the AI assistant
 * This is NOT open-ended - every user message maps to one of these
 */
export enum UserIntent {
    // Menu & Discovery
    BROWSE_MENU = 'browse_menu',
    RECOMMEND_FAST_ITEM = 'recommend_fast_item',
    RECOMMEND_HEALTHY = 'recommend_healthy',
    RECOMMEND_POPULAR = 'recommend_popular',
    SEARCH_ITEM = 'search_item',
    CHECK_AVAILABILITY = 'check_availability',

    // Cart & Ordering
    ADD_TO_CART = 'add_to_cart',
    MODIFY_CART = 'modify_cart',
    CLEAR_CART = 'clear_cart',
    SELECT_SLOT = 'select_slot',
    CONFIRM_ORDER = 'confirm_order',

    // Order Tracking
    CHECK_ORDER_STATUS = 'check_order_status',
    CANCEL_ORDER = 'cancel_order',
    ESTIMATE_WAIT_TIME = 'estimate_wait_time',

    // Feedback & Support
    GIVE_FEEDBACK = 'give_feedback',
    FILE_COMPLAINT = 'file_complaint',
    REPORT_ISSUE = 'report_issue',

    // Payment
    PAYMENT_HELP = 'payment_help',
    REFUND_STATUS = 'refund_status',

    // Admin-specific
    ADMIN_VIEW_ANALYTICS = 'admin_view_analytics',
    ADMIN_RESPOND_FEEDBACK = 'admin_respond_feedback',

    // Fallback
    GENERAL_HELP = 'general_help',
    UNCLEAR = 'unclear'
}

/**
 * Page types in the application
 */
export type PageType = 'menu' | 'order-summary' | 'live-status' | 'feedback' | 'payment' | 'admin' | 'unknown';

/**
 * User role types
 */
export type UserRole = 'customer' | 'admin' | 'canteen_staff';

/**
 * Page context from frontend
 */
export interface PageContext {
    currentPage: PageType;
    route: string;
}

/**
 * User state from frontend
 */
export interface UserState {
    userId: string;
    role: UserRole;
    activeOrderId?: string;
    cartItems?: Array<{
        itemId: string;
        name: string;
        quantity: number;
        price: number;
    }>;
}

/**
 * Live data injected into context
 */
export interface LiveData {
    currentTime: Date;
    availableSlots?: Array<{
        id: string;
        time: string;
        capacity: number;
        currentLoad: number;
    }>;
    menuItems?: Array<{
        id: string;
        name: string;
        price: number;
        prepTime: number;
        available: boolean;
        category: string;
    }>;
    queueLoad?: {
        total: number;
        bySlot: Record<string, number>;
    };
    activeOrder?: {
        id: string;
        status: string;
        items: Array<{ name: string; quantity: number }>;
        estimatedCompletion?: Date;
    };
    recentOrders?: Array<{
        id: string;
        date: Date;
        total: number;
        items: string[];
    }>;
}

/**
 * Enriched context combining all data sources
 */
export interface EnrichedContext {
    pageContext: PageContext;
    userState: UserState;
    liveData: LiveData;
    timestamp: Date;
}

/**
 * Intent classification result
 */
export interface IntentResult {
    intent: UserIntent;
    confidence: number;
    extractedParams: Record<string, unknown>;
    reasoning?: string;
}

/**
 * Page validation result
 */
export interface PageValidationResult {
    valid: boolean;
    redirect?: {
        page: PageType;
        reason: string;
    };
}

/**
 * Action types that can be returned to frontend
 */
export type ActionType = 'action' | 'info' | 'redirect' | 'clarification' | 'error';

/**
 * UI directive types
 */
export interface UIDirective {
    action: 'navigate' | 'highlight' | 'open_modal' | 'refresh';
    target: string;
    params?: Record<string, unknown>;
}

/**
 * Action button for frontend
 */
export interface ActionButton {
    label: string;
    action: string;
    params?: Record<string, unknown>;
    variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * Structured response to frontend
 */
export interface AssistantResponse {
    type: ActionType;
    message: string;
    data?: unknown;
    uiDirective?: UIDirective;
    buttons?: ActionButton[];
    timestamp: Date;
}

/**
 * Domain function execution result
 */
export interface ActionResult {
    success: boolean;
    data?: unknown;
    error?: string;
    message: string;
    uiDirective?: UIDirective;
    buttons?: ActionButton[];
}

/**
 * Request validation schema
 */
export const AssistantRequestSchema = z.object({
    message: z.string().min(1).max(500),
    pageContext: z.object({
        currentPage: z.enum(['menu', 'order-summary', 'live-status', 'feedback', 'payment', 'admin', 'unknown']),
        route: z.string()
    }),
    userState: z.object({
        userId: z.string(),
        role: z.enum(['customer', 'admin', 'canteen_staff']),
        activeOrderId: z.string().optional(),
        cartItems: z.array(z.object({
            itemId: z.string(),
            name: z.string(),
            quantity: z.number().min(1),
            price: z.number().min(0)
        })).optional()
    })
});

export type AssistantRequest = z.infer<typeof AssistantRequestSchema>;

/**
 * Recommendation constraints
 */
export interface RecommendationConstraints {
    maxPrepTime?: number;
    dietary?: string[];
    priceRange?: [number, number];
    category?: string;
    sortBy?: 'prepTime' | 'price' | 'popularity';
}

/**
 * Recommendation result
 */
export interface RecommendationResult {
    items: Array<{
        id: string;
        name: string;
        price: number;
        prepTime: number;
        category: string;
        score: number;
        reason: string;
    }>;
    totalFound: number;
}

/**
 * Cart operation result
 */
export interface CartOperationResult {
    cart: Array<{
        itemId: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    totalItems: number;
    totalAmount: number;
    message: string;
}

/**
 * Slot selection result
 */
export interface SlotSelectionResult {
    slot: {
        id: string;
        time: string;
        capacity: number;
        currentLoad: number;
    };
    reserved: boolean;
    estimatedWaitTime: number;
    message: string;
}

/**
 * Order status result
 */
export interface OrderStatusResult {
    order: {
        id: string;
        status: string;
        items: Array<{ name: string; quantity: number }>;
        totalAmount: number;
        createdAt: Date;
    };
    estimatedCompletion?: Date;
    queuePosition?: number;
    message: string;
}

/**
 * Feedback processing result
 */
export interface FeedbackResult {
    feedback: {
        id: string;
        rating: number;
        text: string;
    };
    classification: {
        sentiment: 'positive' | 'neutral' | 'negative';
        category: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        draftResponse?: string;
    };
    adminAlerted: boolean;
}

/**
 * Complaint classification result
 */
export interface ComplaintClassification {
    category: 'food_quality' | 'service' | 'pricing' | 'delivery' | 'hygiene' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    sentiment: 'positive' | 'neutral' | 'negative';
    suggestedResponse: string;
    tags: string[];
}

/**
 * AI interaction log (for database)
 */
export interface AIInteractionLog {
    userId: string;
    message: string;
    intent: UserIntent;
    confidence: number;
    pageContext: PageContext;
    actionTaken?: string;
    result: 'success' | 'error' | 'clarification';
    responseTime: number;
    timestamp: Date;
}
