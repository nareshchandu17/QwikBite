import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Mock active sessions data
const mockSessions = [
  {
    id: 'current_session',
    device: 'Windows PC - Chrome',
    location: 'Bangalore, IN',
    isActive: true,
    isCurrent: true,
    lastActive: 'Just now',
    ipAddress: '192.168.1.1'
  },
  {
    id: 'mobile_session',
    device: 'iPhone 13 - Safari',
    location: 'Bangalore, IN',
    isActive: false,
    isCurrent: false,
    lastActive: '2 hours ago',
    ipAddress: '103.45.22.12'
  }
];

export async function GET(req: NextRequest) {
  try {
    // console.log(...);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // In a real app, you would fetch from database
    return NextResponse.json({
      success: true,
      data: {
        sessions: mockSessions,
        totalSessions: mockSessions.length
      }
    });

  } catch (error: any) {
    console.error('[DEBUG] Error fetching sessions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sessions: ' + error.message
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    // console.log(...);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    // Prevent revoking current session
    if (sessionId === 'current_session') {
      return NextResponse.json({
        success: false,
        error: 'Cannot revoke current session'
      }, { status: 400 });
    }

    // In a real app, you would:
    // 1. Remove session from database
    // 2. Invalidate session token
    // 3. Log the session revocation

    // console.log(...);

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error: any) {
    console.error('[DEBUG] Error revoking session:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to revoke session: ' + error.message
    }, { status: 500 });
  }
}
