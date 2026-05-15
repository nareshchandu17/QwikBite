import { connectDB } from '../lib/db';
import { Order } from '../models/order.model';
import mongoose from 'mongoose';

async function checkOrders() {
    try {
        console.log('Connecting to DB...');
        await connectDB();
        console.log('Connected.');

        const totalOrders = await Order.countDocuments();
        console.log('Total orders in DB:', totalOrders);

        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('Orders by status:', JSON.stringify(ordersByStatus, null, 2));

        const recentOrders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        
        console.log('Recent 10 orders:');
        recentOrders.forEach((o: any) => {
            console.log(`- ID: ${o.orderId || o._id}, Status: ${o.status}, CreatedAt: ${o.createdAt}, Items: ${o.items?.length}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkOrders();
