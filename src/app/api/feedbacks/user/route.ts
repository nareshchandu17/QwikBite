import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Feedback from '@/models/feedback';
import { verifyToken, parseCookies } from '@/lib/auth';

// Helper to get user ID from auth token
const getUserId = (req: NextRequest): string | null => {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies['auth_token'];
  if (!token) return null;
  
  const payload = verifyToken(token);
  return payload?.id || null;
};

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const userId = getUserId(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const feedbacks = await Feedback.find({ userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: feedbacks }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching user feedbacks:', error);
    return NextResponse.json({ error: 'Failed to fetch feedbacks', success: false }, { status: 500 });
  }
}

