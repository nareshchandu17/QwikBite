export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';

const defaultNotificationSettings = {
  newOrderEmail: false,
  delayedOrderEmail: false,
  lowStockEmail: false,
  paymentFailureEmail: false,
  pushNotifications: false
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('settings');
    const settings = (user as any)?.settings?.notifications || defaultNotificationSettings;

    return NextResponse.json({
      success: true,
      data: { ...defaultNotificationSettings, ...settings }
    });
  } catch (error: any) {
    console.error('[DEBUG] Error loading notification settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load notification settings: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const notificationData = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const validatedData = {
      newOrderEmail: Boolean(notificationData.newOrderEmail),
      delayedOrderEmail: Boolean(notificationData.delayedOrderEmail),
      lowStockEmail: Boolean(notificationData.lowStockEmail),
      paymentFailureEmail: Boolean(notificationData.paymentFailureEmail),
      pushNotifications: Boolean(notificationData.pushNotifications)
    };

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!(user as any).settings) (user as any).settings = {};
    (user as any).settings.notifications = validatedData;
    user.markModified('settings');
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: validatedData
    });
  } catch (error: any) {
    console.error('[DEBUG] Error updating notification settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update notification settings: ' + error.message }, { status: 500 });
  }
}
