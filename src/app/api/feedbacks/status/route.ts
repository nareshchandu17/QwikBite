import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(req: NextRequest) {
  try {
    const { feedbackId, status } = await req.json();

    if (!feedbackId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feedback ID and status are required' 
      }, { status: 400 });
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid status. Must be approved, rejected, or pending' 
      }, { status: 400 });
    }

    // Admin authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (!['admin', 'canteen_staff'].includes(userRole as any)) {
      return NextResponse.json({ success: false, error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db();

    // Update the feedback status
    const result = await db.collection('feedbacks').updateOne(
      { feedbackId: feedbackId },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        }
      }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feedback not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Feedback ${status} successfully` 
    });

  } catch (error: any) {
    console.error('Error updating feedback status:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
