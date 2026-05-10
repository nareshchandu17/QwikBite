import { RecommendationConstraints, RecommendationResult, EnrichedContext } from '../types';
import { connectDB } from '@/lib/db';
import { MenuItem } from '@/models/menuItem.model';

/**
 * Get menu recommendations based on constraints
 * Scores items by prep time, availability, and popularity
 */
export async function getRecommendations(
    constraints: RecommendationConstraints,
    context: EnrichedContext
): Promise<RecommendationResult> {
    await connectDB();

    // Build query
    const query: Record<string, unknown> = { availability: true };

    // Apply filters
    if (constraints.category) {
        query.category = constraints.category;
    }

    if (constraints.dietary && constraints.dietary.length > 0) {
        query.dietary = { $in: constraints.dietary };
    }

    if (constraints.priceRange) {
        query.price = {
            $gte: constraints.priceRange[0],
            $lte: constraints.priceRange[1]
        };
    }

    if (constraints.maxPrepTime) {
        query.preparationTime = { $lte: constraints.maxPrepTime };
    }

    // Fetch items
    const items = await MenuItem.find(query)
        .select('name price preparationTime category dietary popularity')
        .lean()
        .limit(50);

    // Score items
    const scoredItems = items.map(item => {
        let score = 0;
        const reasons: string[] = [];

        // Prep time scoring (faster = better)
        const prepTime = item.preparationTime || 15;
        if (prepTime <= 10) {
            score += 30;
            reasons.push('very fast');
        } else if (prepTime <= 15) {
            score += 20;
            reasons.push('fast');
        } else if (prepTime <= 20) {
            score += 10;
        }

        // Price scoring (cheaper = better for budget)
        if (item.price < 50) {
            score += 15;
            reasons.push('budget-friendly');
        } else if (item.price < 100) {
            score += 10;
        }

        // Popularity scoring
        const popularity = (item as { popularity?: number }).popularity || 0;
        score += Math.min(30, popularity * 3);
        if (popularity > 5) {
            reasons.push('popular');
        }

        // Dietary preferences
        if (constraints.dietary) {
            const itemDietary = (item as { dietary?: string[] }).dietary || [];
            const matches = constraints.dietary.filter(d => itemDietary.includes(d));
            if (matches.length > 0) {
                score += matches.length * 10;
                reasons.push(matches.join(', '));
            }
        }

        // Time constraint bonus
        if (constraints.maxPrepTime && prepTime <= constraints.maxPrepTime) {
            score += 20;
        }

        return {
            id: item._id.toString(),
            name: item.name,
            price: item.price,
            prepTime,
            category: item.category || 'Other',
            score,
            reason: reasons.length > 0 ? reasons.join(', ') : 'available now'
        };
    });

    // Sort by score
    scoredItems.sort((a, b) => b.score - a.score);

    // Return top 3
    return {
        items: scoredItems.slice(0, 3),
        totalFound: scoredItems.length
    };
}

/**
 * Search for specific menu items
 */
export async function searchMenuItems(
    query: string,
    context: EnrichedContext
): Promise<RecommendationResult> {
    await connectDB();

    const items = await MenuItem.find({
        available: true,
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    })
        .select('name price prepTime category')
        .lean()
        .limit(10);

    return {
        items: items.map(item => ({
            id: item._id.toString(),
            name: item.name,
            price: item.price,
            prepTime: item.preparationTime || 15,
            category: item.category || 'Other',
            score: 100,
            reason: 'matches search'
        })),
        totalFound: items.length
    };
}

/**
 * Check item availability
 */
export async function checkAvailability(
    itemName: string,
    context: EnrichedContext
): Promise<{ available: boolean; item?: any; message: string }> {
    await connectDB();

    const item = await MenuItem.findOne({
        name: { $regex: itemName, $options: 'i' }
    }).lean();

    if (!item) {
        return {
            available: false,
            message: `Item "${itemName}" not found in menu`
        };
    }

    if (!item.isAvailable) {
        return {
            available: false,
            item: {
                id: item._id.toString(),
                name: item.name,
                price: item.price
            },
            message: `${item.name} is currently unavailable`
        };
    }

    return {
        available: true,
        item: {
            id: item._id.toString(),
            name: item.name,
            price: item.price,
            prepTime: item.preparationTime || 15
        },
        message: `${item.name} is available (₹${item.price}, ~${item.preparationTime || 15} min)`
    };
}
