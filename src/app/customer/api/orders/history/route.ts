import { NextResponse } from 'next/server';
import { connectToDatabase, collections } from '@/lib/db/mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const { db } = await connectToDatabase();
    
    // Get paginated orders
    const orders = await db.collection(collections.orders)
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await db.collection(collections.orders)
      .countDocuments({});

    return NextResponse.json({
      orders: orders.map(order => ({
        ...order,
        _id: order._id.toString(),
        id: order._id.toString()
      })),
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching order history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order history' },
      { status: 500 }
    );
  }
}
