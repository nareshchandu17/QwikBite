export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Mock workflow settings data
const defaultWorkflowSettings = {
  autoMoveToPreparing: false,
  maxPrepTimeMinutes: 15,
  autoFlagDelayed: false,
  allowAdminCancel: false
};

export async function GET(req: NextRequest) {
  try {
    // console.log(...);

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
      data: defaultWorkflowSettings
    });

  } catch (error: any) {
    console.error('[DEBUG] Error loading workflow settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load workflow settings: ' + error.message
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const workflowData = await req.json();

    // console.log(...);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Validate workflow data
    const validatedData = {
      autoMoveToPreparing: Boolean(workflowData.autoMoveToPreparing),
      maxPrepTimeMinutes: Math.max(1, Math.min(120, parseInt(workflowData.maxPrepTimeMinutes) || 15)),
      autoFlagDelayed: Boolean(workflowData.autoFlagDelayed),
      allowAdminCancel: Boolean(workflowData.allowAdminCancel)
    };

    // In a real app, you would:
    // 1. Validate business rules
    // 2. Update workflow settings in database
    // 3. Update any active orders if needed
    // 4. Log the settings change

    // console.log(...);

    // Simulate database update
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Workflow settings updated successfully',
      data: validatedData
    });

  } catch (error: any) {
    console.error('[DEBUG] Error updating workflow settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update workflow settings: ' + error.message
    }, { status: 500 });
  }
}
