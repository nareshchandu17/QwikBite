import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import connectToDatabase from '@/lib/db';
import { Notification } from '@/lib/models';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDatabase();
    await Notification.findOneAndDelete({ _id: params.id, userId: user.id });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
