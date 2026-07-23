export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { generateClientCSRFToken } from '@/lib/security/csrf';

/**
 * GET /api/csrf - Generate and return CSRF token for client
 */
export async function GET() {
  try {
    const secret = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
    const { token, signature } = generateClientCSRFToken(secret);
    
    return NextResponse.json({
      success: true,
      token,
      signature
    });
  } catch (error) {
    console.error('[CSRF GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
