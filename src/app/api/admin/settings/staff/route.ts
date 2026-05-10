import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Mock staff settings data
const defaultStaffSettings = {
  roleBasedAccess: false,
  allowStaffCancel: false
};

export async function GET(req: NextRequest) {
  try {
    console.log('[DEBUG] Loading staff settings');

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // In a real app, you would fetch from database
    return NextResponse.json({
      success: true,
      data: defaultStaffSettings
    });

  } catch (error: unknown) {
    console.error('[DEBUG] Error loading staff settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load staff settings: ' + error.message
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const staffData = await req.json();

    console.log('[DEBUG] Updating staff settings:', staffData);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Validate staff data
    const validatedData = {
      roleBasedAccess: Boolean(staffData.roleBasedAccess),
      allowStaffCancel: Boolean(staffData.allowStaffCancel)
    };

    // In a real app, you would:
    // 1. Validate business rules
    // 2. Update staff settings in database
    // 3. Update staff permissions if needed
    // 4. Log the settings change
    // 5. Notify affected staff members of permission changes

    console.log('[DEBUG] Staff settings validated:', validatedData);

    // Simulate database update
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Staff settings updated successfully',
      data: validatedData
    });

  } catch (error: unknown) {
    console.error('[DEBUG] Error updating staff settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update staff settings: ' + error.message
    }, { status: 500 });
  }
}
