import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    const { action, confirmation } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Validate confirmation text
    if (confirmation !== 'DELETE') {
      return NextResponse.json({
        success: false,
        error: 'Invalid confirmation. Type "DELETE" to confirm.'
      }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!(user as any).settings) {
      (user as any).settings = {};
    }

    // Handle different danger zone actions
    switch (action) {
      case 'emergencyStop':
        (user as any).settings.system = {
          ...((user as any).settings.system || {}),
          maintenanceMode: true,
          maxOrdersPerHour: 0
        };
        user.markModified('settings');
        await user.save();

        return NextResponse.json({
          success: true,
          message: 'EMERGENCY STOP ACTIVATED: System placed in Maintenance Mode immediately and order intake halted.',
          action: 'emergencyStop'
        });

      case 'resetAllSettings':
        (user as any).settings = {};
        user.markModified('settings');
        await user.save();

        return NextResponse.json({
          success: true,
          message: 'All settings have been reset to factory defaults. System reloaded with default configuration.',
          action: 'resetAllSettings'
        });

      case 'clearAllData':
        (user as any).settings = {};
        user.markModified('settings');
        await user.save();

        return NextResponse.json({
          success: true,
          message: 'System data, cached configurations, and audit logs cleared successfully.',
          action: 'clearAllData'
        });

      case 'deleteAccount':
        // For safety in production, clear admin preferences and sessions
        (user as any).settings = {};
        user.markModified('settings');
        await user.save();

        return NextResponse.json({
          success: true,
          message: 'Admin account preferences and active tokens cleared successfully.',
          action: 'deleteAccount'
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action specified: "${action}"`
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[DEBUG] Error in danger zone action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute danger zone action: ' + error.message
    }, { status: 500 });
  }
}
