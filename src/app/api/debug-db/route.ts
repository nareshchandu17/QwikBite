import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';

export async function GET() {
    try {
        await connectToDatabase();

        if (mongoose.connection.db) {
            const collections = await mongoose.connection.db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);

            const menuItemsCount = await mongoose.connection.db.collection('menuitems').countDocuments();
            const availableItemsCount = await mongoose.connection.db.collection('menuitems').countDocuments({ available: true });
            const unavailableItemsCount = await mongoose.connection.db.collection('menuitems').countDocuments({ available: false });

            return NextResponse.json({
                status: 'connected',
                databaseName: mongoose.connection.db.databaseName,
                collections: collectionNames,
                totalMenuItems: menuItemsCount,
                availableMenuItems: availableItemsCount,
                unavailableMenuItems: unavailableItemsCount
            });
        } else {
            return NextResponse.json({ status: 'error', message: 'Database connection established but db instance missing' }, { status: 500 });
        }

    } catch (err: unknown) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
