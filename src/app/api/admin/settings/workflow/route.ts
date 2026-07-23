export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';

const defaultWorkflowSettings = {
  autoMoveToPreparing: false,
  maxPrepTimeMinutes: 15,
  autoFlagDelayed: false,
  allowAdminCancel: false
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('settings');
    const settings = (user as any)?.settings?.workflow || defaultWorkflowSettings;

    return NextResponse.json({
      success: true,
      data: { ...defaultWorkflowSettings, ...settings }
    });
  } catch (error: any) {
    console.error('[DEBUG] Error loading workflow settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load workflow settings: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const workflowData = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const validatedData = {
      autoMoveToPreparing: Boolean(workflowData.autoMoveToPreparing),
      maxPrepTimeMinutes: Math.max(1, Math.min(120, parseInt(workflowData.maxPrepTimeMinutes) || 15)),
      autoFlagDelayed: Boolean(workflowData.autoFlagDelayed),
      allowAdminCancel: Boolean(workflowData.allowAdminCancel)
    };

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!(user as any).settings) (user as any).settings = {};
    (user as any).settings.workflow = validatedData;
    user.markModified('settings');
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Workflow settings updated successfully',
      data: validatedData
    });
  } catch (error: any) {
    console.error('[DEBUG] Error updating workflow settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update workflow settings: ' + error.message }, { status: 500 });
  }
}
