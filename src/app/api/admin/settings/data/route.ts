import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';

export const dynamic = "force-dynamic";

const defaultDataSettings = {
  autoBackup: false,
  backupFrequency: 'daily',
  retentionDays: 30
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('settings');
    const settings = (user as any)?.settings?.data || (user as any)?.settings?.backup || defaultDataSettings;

    return NextResponse.json({
      success: true,
      data: { ...defaultDataSettings, ...settings }
    });
  } catch (error: any) {
    console.error('[DEBUG] Error loading data settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load data settings: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const dataSettings = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const validatedData = {
      autoBackup: Boolean(dataSettings.autoBackup),
      backupFrequency: ['daily', 'weekly', 'monthly'].includes(dataSettings.backupFrequency) 
        ? dataSettings.backupFrequency 
        : 'daily',
      retentionDays: Math.max(7, Math.min(365, parseInt(dataSettings.retentionDays) || 30))
    };

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!(user as any).settings) (user as any).settings = {};
    (user as any).settings.data = validatedData;
    (user as any).settings.backup = validatedData;
    user.markModified('settings');
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Data settings updated successfully',
      data: validatedData
    });
  } catch (error: any) {
    console.error('[DEBUG] Error updating data settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update data settings: ' + error.message }, { status: 500 });
  }
}
