export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';

const defaultStaffSettings = {
  roleBasedAccess: false,
  allowStaffCancel: false
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('settings');
    const settings = (user as any)?.settings?.staff || defaultStaffSettings;

    return NextResponse.json({
      success: true,
      data: { ...defaultStaffSettings, ...settings }
    });
  } catch (error: any) {
    console.error('[DEBUG] Error loading staff settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load staff settings: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const staffData = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const validatedData = {
      roleBasedAccess: Boolean(staffData.roleBasedAccess),
      allowStaffCancel: Boolean(staffData.allowStaffCancel)
    };

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!(user as any).settings) (user as any).settings = {};
    (user as any).settings.staff = validatedData;
    user.markModified('settings');
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Staff settings updated successfully',
      data: validatedData
    });
  } catch (error: any) {
    console.error('[DEBUG] Error updating staff settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update staff settings: ' + error.message }, { status: 500 });
  }
}
