import { NextRequest, NextResponse } from 'next/server';
import { generateToken, verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // If verifyToken is true, verify the token from Authorization header
    if (body.verifyToken) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No token provided' }, { status: 400 });
      }
      
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (!decoded) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      
      return NextResponse.json({ 
        success: true, 
        decoded,
        tokenValid: true 
      });
    }
    
    // Otherwise, generate a new token
    const testPayload = body.testPayload || {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User'
    };
    
    const token = generateToken(testPayload);
    
    return NextResponse.json({ 
      success: true, 
      token,
      payload: testPayload 
    });
    
  } catch (error: unknown) {
    console.error('JWT Test API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
