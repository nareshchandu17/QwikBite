import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Log request info for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth debug API called:', {
        url: request.url,
        method: request.method,
        headers: {
          cookie: request.headers.get('cookie'),
          userAgent: request.headers.get('user-agent'),
        },
      });
    }
    
    // Get token from cookie
    const token = getAuthCookie(request);
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        message: 'No auth token found in cookies',
        cookies: request.headers.get('cookie')
      });
    }

    // Log token info for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Found auth token:', {
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...',
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token',
        tokenLength: token.length
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Authentication successful',
      user: decoded,
      tokenLength: token.length
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}