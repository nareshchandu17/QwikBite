import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Notification } from '@/lib/models';
import { parseCookies, verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies['auth_token'];
  const payload = token ? verifyToken(token) : null;
  if (!payload?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notif = await Notification.findById(id);
  if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (String(notif.userId) !== String(payload.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  notif.read = true;
  await notif.save();
  return NextResponse.json({ data: notif }, { status: 200 });
}
