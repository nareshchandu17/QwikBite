import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Feedback from '@/models/feedback';

// GET /api/feedbacks/:id - Fetch single feedback
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[GET /api/feedbacks/:id] Fetching feedback:', params.id);
    
    await connectToDatabase();
    
    const feedback = await Feedback.findById(params.id);
    
    if (!feedback) {
      console.error('[GET /api/feedbacks/:id] Feedback not found:', params.id);
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    console.log('[GET /api/feedbacks/:id] ✅ Feedback fetched:', params.id);
    return NextResponse.json({
      success: true,
      data: feedback,
    });
  } catch (error: unknown) {
    console.error('[GET /api/feedbacks/:id] ❌ Error fetching feedback:', {
      id: params.id,
      error: error.message,
    });
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch feedback',
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
      },
      { status: 500 }
    );
  }
}

// Update feedback (for admin replies)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { adminReply } = await request.json();
    
    if (!adminReply || typeof adminReply !== 'string') {
      return NextResponse.json(
        { error: 'adminReply is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (!adminReply.trim()) {
      return NextResponse.json(
        { error: 'adminReply cannot be empty' },
        { status: 400 }
      );
    }

    console.log('[PATCH /api/feedbacks/:id] Starting update for ID:', params.id);
    
    await connectToDatabase();
    console.log('[PATCH /api/feedbacks/:id] Database connected');
    
    const feedback = await Feedback.findByIdAndUpdate(
      params.id,
      { 
        adminReply: adminReply.trim(),
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );
    
    if (!feedback) {
      console.error('[PATCH /api/feedbacks/:id] Feedback not found for ID:', params.id);
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    console.log('[PATCH /api/feedbacks/:id] ✅ Feedback updated successfully:', params.id);
    return NextResponse.json({
      success: true,
      data: feedback,
      message: 'Reply added successfully'
    });
  } catch (error: unknown) {
    console.error('[PATCH /api/feedbacks/:id] ❌ Error updating feedback:', {
      id: params.id,
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update feedback',
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
      },
      { status: 500 }
    );
  }
}
