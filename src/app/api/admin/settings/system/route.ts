export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';

const defaultSystemSettings = {
  maintenanceMode: false,
  maxOrdersPerHour: 50,
  enableAnalytics: false,
  enableDebugMode: false,
  operatingHoursStart: '09:00',
  operatingHoursEnd: '21:00'
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('settings');
    const settings = (user as any)?.settings?.system || defaultSystemSettings;

    return NextResponse.json({
      success: true,
      data: { ...defaultSystemSettings, ...settings }
    });
  } catch (error: any) {
    console.error('[DEBUG] Error loading system settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load system settings: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const systemData = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const validatedData = {
      maintenanceMode: Boolean(systemData.maintenanceMode),
      maxOrdersPerHour: Math.max(1, Math.min(1000, parseInt(systemData.maxOrdersPerHour) || 50)),
      enableAnalytics: Boolean(systemData.enableAnalytics),
      enableDebugMode: Boolean(systemData.enableDebugMode),
      operatingHoursStart: systemData.operatingHoursStart || '09:00',
      operatingHoursEnd: systemData.operatingHoursEnd || '21:00'
    };

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!(user as any).settings) (user as any).settings = {};
    (user as any).settings.system = validatedData;
    user.markModified('settings');
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      data: validatedData
    });
  } catch (error: any) {
    console.error('[DEBUG] Error updating system settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update system settings: ' + error.message }, { status: 500 });
  }
}
