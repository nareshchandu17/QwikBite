import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import connectToDatabase from '@/lib/db';
import { Notification } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDatabase();
    await Notification.updateMany({ userId: user.id }, { read: true });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
