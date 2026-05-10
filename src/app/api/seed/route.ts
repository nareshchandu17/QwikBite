import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { MenuItem } from '@/lib/models';
import { menuItems } from '@/data/menu';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        // Clear existing items
        await MenuItem.deleteMany({});

        // Insert new items
        // We need to ensure we don't pass the string 'id' as '_id' if it's not a valid ObjectId
        // The model typically auto-generates _id if not provided.
        // The local data has 'id' (string "1", "2"). We should map this to 'id' field, not '_id'.

        const itemsToInsert = menuItems.map(item => ({
            ...item,
            // We rely on Mongoose to generate a new _id (ObjectId)
            // We keep the existing 'id' field as a legacy reference id
            price: Number(item.price),
            calories: Number(item.calories),
            available: true
        }));

        const result = await MenuItem.insertMany(itemsToInsert);

        return NextResponse.json({
            success: true,
            message: `Seeded ${result.length} items`,
            items: result
        });
    } catch (error: unknown) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
