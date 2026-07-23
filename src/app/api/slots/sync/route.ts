import { NextRequest, NextResponse } from 'next/server';
import { syncTimeSlotUsage } from '@/lib/slot-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check - only admin or canteen_staff can trigger sync
    const userRole = (session.user as { role?: string }).role;
    if (!['admin', 'canteen_staff'].includes(userRole as any)) {
      return NextResponse.json({ 
        error: 'Forbidden - Insufficient permissions' 
      }, { status: 403 });
    }

    // Rate limiting
    const identifier = getRateLimitIdentifier(req as Request);
    const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await syncTimeSlotUsage();
    
    // Trigger real-time update via Pusher
    await pusherServer.trigger('admin', 'slot-update', { 
      action: 'sync',
      timestamp: new Date().toISOString()
    });
    
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
