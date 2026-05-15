import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAuthCookie } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import FeedbackMessage from '@/lib/models/FeedbackMessage';
import { Types } from 'mongoose';

// GET /api/feedback-messages - Fetch feedback messages
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get token from cookie or Authorization header
    const token = getAuthCookie(req) || req.headers.get('authorization')?.replace('Bearer ', '');
    const session = token ? verifyToken(token) : null;
    
    // For development, allow access without authentication but return mock data
    if (!session?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Returning mock feedback data');
        const mockFeedbacks = [
          {
            _id: '1',
            customerDetails: {
              name: 'John Doe',
              email: 'john@example.com'
            },
            message: 'Great food and excellent service!',
            status: 'open',
            createdAt: new Date('2024-01-20T10:30:00Z'),
            updatedAt: new Date('2024-01-20T10:30:00Z')
          },
          {
            _id: '2',
            customerDetails: {
              name: 'Jane Smith',
              email: 'jane@example.com'
            },
            message: 'The canteen could use more vegetarian options.',
            status: 'replied',
            createdAt: new Date('2024-01-19T14:15:00Z'),
            updatedAt: new Date('2024-01-20T09:00:00Z')
          }
        ];
        
        return NextResponse.json({
          success: true,
          data: mockFeedbacks,
          pagination: {
            page: 1,
            limit: 20,
            total: mockFeedbacks.length,
            pages: Math.ceil(mockFeedbacks.length / 20)
          }
        });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const limit = Math.min(Number(url.searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const status = url.searchParams.get('status');

    // Build query
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch feedback messages with customer details
    const feedbacks = await FeedbackMessage.find(query)
      .populate('customerDetails', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await FeedbackMessage.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: feedbacks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feedback messages:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch feedback' 
    }, { status: 500 });
  }
}

// POST /api/feedback-messages - Create new feedback (customers only)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Get token from cookie or Authorization header
    const token = getAuthCookie(req) || req.headers.get('authorization')?.replace('Bearer ', '');
    const session = token ? verifyToken(token) : null;
    
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'customer') {
      return NextResponse.json({ error: 'Only customers can submit feedback' }, { status: 403 });
    }

    const { message } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 });
    }

    // Create feedback message in database
    const feedback = await FeedbackMessage.create({
      customerId: new Types.ObjectId(session.id),
      message: message.trim(),
      status: 'open'
    });

    // Populate customer details for response
    await feedback.populate('customerDetails', 'name email');

    return NextResponse.json({ 
      success: true,
      data: feedback 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback message:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
