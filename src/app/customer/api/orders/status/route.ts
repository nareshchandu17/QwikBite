import { NextResponse } from 'next/server';
import { connectToDatabase, collections } from '@/lib/db/mongodb';

export async function POST(req: Request) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Update order status
    const updateResult = await db.collection(collections.orders).updateOne(
      { _id: orderId },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Record status update
    await db.collection(collections.orderStatusUpdates).insertOne({
      orderId,
      status,
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // If order is completed, calculate and store preparation time
    if (status === 'COMPLETED') {
      const order = await db.collection(collections.orders).findOne({ _id: orderId });
      if (order) {
        const preparationTime = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
        await db.collection(collections.orders).updateOne(
          { _id: orderId },
          { $set: { preparationTime } }
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
