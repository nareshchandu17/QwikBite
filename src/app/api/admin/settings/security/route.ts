export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';

const defaultSecuritySettings = {
  twoFactorAuth: false,
  autoLockMinutes: 15,
  sessionTimeoutMinutes: 60
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('settings');
    const settings = (user as any)?.settings?.security || defaultSecuritySettings;

    return NextResponse.json({
      success: true,
      data: { ...defaultSecuritySettings, ...settings }
    });
  } catch (error: any) {
    console.error('[DEBUG] Error loading security settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load security settings: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const securityData = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const validatedData = {
      twoFactorAuth: Boolean(securityData.twoFactorAuth),
      autoLockMinutes: Math.max(1, Math.min(120, parseInt(securityData.autoLockMinutes) || 15)),
      sessionTimeoutMinutes: Math.max(5, Math.min(480, parseInt(securityData.sessionTimeoutMinutes) || 60))
    };

    if (validatedData.autoLockMinutes >= validatedData.sessionTimeoutMinutes) {
      return NextResponse.json({
        success: false,
        error: 'Auto-lock time must be less than session timeout'
      }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!(user as any).settings) (user as any).settings = {};
    (user as any).settings.security = validatedData;
    user.markModified('settings');
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Security settings updated successfully',
      data: validatedData
    });
  } catch (error: any) {
    console.error('[DEBUG] Error updating security settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update security settings: ' + error.message }, { status: 500 });
  }
}
