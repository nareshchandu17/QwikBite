import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('[Auth Test] Testing authentication...');
    
    // Check all possible token sources
    let token = getAuthCookie(request);
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('[Auth Test] Using token from Authorization header');
      }
    }
    
    console.log('[Auth Test] Token found:', !!token);
    
    if (!token) {
      return NextResponse.json({ 
        error: 'No token found',
        sources: ['cookie', 'authorization header']
      }, { status: 401 });
    }

    console.log('[Auth Test] Token value (first 20 chars):', token.substring(0, 20) + '...');
    
    try {
      const decoded = verifyToken(token);
      console.log('[Auth Test] Token verification successful:', decoded);
      
      return NextResponse.json({ 
        success: true,
        user: decoded,
        tokenValid: true
      });
    } catch (verifyError) {
      console.error('[Auth Test] Token verification failed:', verifyError);
      return NextResponse.json({ 
        error: 'Token verification failed',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      }, { status: 401 });
    }
    
  } catch (error) {
    console.error('[Auth Test] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
