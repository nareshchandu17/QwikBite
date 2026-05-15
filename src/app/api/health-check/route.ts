import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/order.model';

export async function GET() {
    try {
        await connectDB();
        
        const db = mongoose.connection.db!;
        const collections = await db.listCollections().toArray();
        const stats: any[] = [];
        
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            stats.push({ name: col.name, count });
        }
        
        // Fetch sample orders using the Order model (same as admin API)
        const sampleOrders = await Order.find({}).sort({ createdAt: -1 }).limit(3).lean();
        const mappedOrders = sampleOrders.map((o: any) => ({
            id: o.orderId || o._id?.toString(),
            status: o.status,
            itemCount: o.items?.length,
            firstItemImage: o.items?.[0]?.image,
            firstItemName: o.items?.[0]?.name,
            totalAmount: o.totalAmount,
            createdAt: o.createdAt,
        }));
        
        return NextResponse.json({
            database: mongoose.connection.name,
            host: mongoose.connection.host,
            collections: stats,
            sampleOrders: mappedOrders,
            orderModelName: Order.modelName,
            orderCollection: Order.collection.name,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
