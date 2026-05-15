export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = getAuthCookie(request);
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        message: 'No auth token found'
      }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Authentication successful',
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}