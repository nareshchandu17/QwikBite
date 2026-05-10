import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie, verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    console.log('=== Debug Authentication ===');
    
    // Check cookies
    const cookieHeader = req.headers.get('cookie');
    console.log('Cookie header:', cookieHeader);
    
    const token = getAuthCookie(req);
    console.log('Token from cookie:', token ? `${token.substring(0, 20)}...` : 'Not found');
    
    // Check Authorization header
    const authHeader = req.headers.get('authorization');
    console.log('Authorization header:', authHeader);
    
    const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    console.log('Token from header:', headerToken ? `${headerToken.substring(0, 20)}...` : 'Not found');
    
    // Try to verify the token
    const tokenToVerify = token || headerToken;
    if (tokenToVerify) {
      try {
        const decoded = verifyToken(tokenToVerify);
        console.log('Token verification result:', decoded);
        console.log('User ID:', decoded?.id);
        console.log('User email:', decoded?.email);
        
        return NextResponse.json({
          success: true,
          tokenFound: true,
          tokenVerified: true,
          user: decoded
        });
      } catch (error) {
        console.error('Token verification failed:', error);
        return NextResponse.json({
          success: false,
          tokenFound: true,
          tokenVerified: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        tokenFound: false,
        message: 'No authentication token found'
      });
    }
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
