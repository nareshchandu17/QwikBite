import { NextRequest, NextResponse } from 'next/server';
import { syncTimeSlotUsage } from '@/lib/slot-utils';
import { verifyAuth, createSecureResponse } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  try {
    // Only admins or staff should be able to trigger a full sync
    const auth = await verifyAuth(req);
    
    if (!auth.success || !auth.user) {
      return createSecureResponse(auth);
    }

    if (auth.user.role !== 'admin' && auth.user.role !== 'staff') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Admin or Staff role required' 
      }, { status: 403 });
    }

    await syncTimeSlotUsage();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Slots reconciled successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('[Slot Sync API] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync slots' },
      { status: 500 }
    );
  }
}

// GET can also be used for periodic health checks
export async function GET(req: NextRequest) {
    try {
        await syncTimeSlotUsage();
        return NextResponse.json({ 
          success: true,
          message: 'Background sync completed'
        }, { status: 200 });
    } catch (error) {
        console.error('[Slot GET Sync] ❌ Error:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Sync failed' 
        }, { status: 500 });
    }
}
