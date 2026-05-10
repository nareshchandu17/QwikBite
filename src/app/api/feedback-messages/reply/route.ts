import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth';
import connectToDatabase from '@/lib/db';
import FeedbackMessage from '@/lib/models/FeedbackMessage';
import { Types } from 'mongoose';

// PUT /api/feedback-messages/reply - Admin replies to feedback
export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can reply to feedback' }, { status: 403 });
    }

    const { feedbackId, reply, customerId } = await req.json();

    if (!feedbackId || !Types.ObjectId.isValid(feedbackId)) {
      return NextResponse.json({ error: 'Valid feedback ID is required' }, { status: 400 });
    }

    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      return NextResponse.json({ error: 'Reply message is required' }, { status: 400 });
    }

    if (!customerId || !Types.ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: 'Valid customer ID is required' }, { status: 400 });
    }

    if (reply.length > 1000) {
      return NextResponse.json({ error: 'Reply too long (max 1000 characters)' }, { status: 400 });
    }

    const feedback = await FeedbackMessage.findByIdAndUpdate(
      feedbackId,
      { 
        reply: reply.trim(), 
        status: 'replied',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('customerDetails', 'name email');

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    return NextResponse.json({ data: feedback }, { status: 200 });
  } catch (error) {
    console.error('Error replying to feedback:', error);
    return NextResponse.json({ error: 'Failed to reply to feedback' }, { status: 500 });
  }
}
