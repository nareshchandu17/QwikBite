import { CartOperationResult, EnrichedContext } from '../types';
import { connectDB } from '@/lib/db';
import { MenuItem } from '@/models/menuItem.model';

/**
 * Cart operations
 * Note: In a real implementation, cart would be stored in database or session
 * For now, we'll work with the cart from userState and return updated cart
 */

/**
 * Add item to cart
 */
export async function addToCart(
    params: {
        itemId?: string;
        itemName?: string;
        quantity?: number;
    },
    context: EnrichedContext
): Promise<CartOperationResult> {
    await connectDB();

    const quantity = params.quantity || 1;

    // Find item by ID or name
    let item;
    if (params.itemId) {
        item = await MenuItem.findById(params.itemId).lean();
    } else if (params.itemName) {
        item = await MenuItem.findOne({
            name: { $regex: params.itemName, $options: 'i' },
            availability: true
        }).lean();
    }

    if (!item) {
        throw new Error('Item not found or unavailable');
    }

    if (!item.isAvailable) {
        throw new Error(`${item.name} is currently unavailable`);
    }

    // Get current cart from context
    const currentCart = context.userState.cartItems || [];

    // Check if item already in cart
    const existingItemIndex = currentCart.findIndex(
        cartItem => cartItem.itemId === item!._id.toString()
    );

    let updatedCart;
    if (existingItemIndex >= 0) {
        // Update quantity
        updatedCart = [...currentCart];
        updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            quantity: updatedCart[existingItemIndex].quantity + quantity
        };
    } else {
        // Add new item
        updatedCart = [
            ...currentCart,
            {
                itemId: item._id.toString(),
                name: item.name,
                quantity,
                price: item.price
            }
        ];
    }

    const totalItems = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
        cart: updatedCart,
        totalItems,
        totalAmount,
        message: `Added ${quantity}x ${item.name} to cart`
    };
}

/**
 * Modify cart item quantity
 */
export async function modifyCart(
    params: {
        itemId: string;
        quantity: number;
    },
    context: EnrichedContext
): Promise<CartOperationResult> {
    const currentCart = context.userState.cartItems || [];

    if (params.quantity <= 0) {
        // Remove item
        const updatedCart = currentCart.filter(item => item.itemId !== params.itemId);
        const totalItems = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
            cart: updatedCart,
            totalItems,
            totalAmount,
            message: 'Item removed from cart'
        };
    }

    // Update quantity
    const updatedCart = currentCart.map(item =>
        item.itemId === params.itemId
            ? { ...item, quantity: params.quantity }
            : item
    );

    const totalItems = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
        cart: updatedCart,
        totalItems,
        totalAmount,
        message: 'Cart updated'
    };
}

/**
 * Clear entire cart
 */
export async function clearCart(
    context: EnrichedContext
): Promise<CartOperationResult> {
    return {
        cart: [],
        totalItems: 0,
        totalAmount: 0,
        message: 'Cart cleared'
    };
}

/**
 * Get cart summary
 */
export async function getCartSummary(
    context: EnrichedContext
): Promise<CartOperationResult> {
    const cart = context.userState.cartItems || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
        cart,
        totalItems,
        totalAmount,
        message: totalItems > 0
            ? `You have ${totalItems} item(s) in cart (₹${totalAmount})`
            : 'Your cart is empty'
    };
}
