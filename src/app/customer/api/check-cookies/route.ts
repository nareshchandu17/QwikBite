import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  
  // Log all cookies for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('All cookies in request:', cookieHeader);
  }
  
  return NextResponse.json({ 
    success: true,
    cookieHeader,
    cookies: cookieHeader ? cookieHeader.split(';').map(c => c.trim()) : []
  });
}