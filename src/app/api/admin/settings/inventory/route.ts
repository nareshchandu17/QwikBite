import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';

export const dynamic = "force-dynamic";

const defaultInventorySettings = {
  autoDeductOnOrder: false,
  lowStockThreshold: 10,
  autoDisableLowStock: false,
  allowNegativeStock: false
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('settings');
    const settings = (user as any)?.settings?.inventory || defaultInventorySettings;

    return NextResponse.json({
      success: true,
      data: { ...defaultInventorySettings, ...settings }
    });
  } catch (error: any) {
    console.error('[DEBUG] Error loading inventory settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load inventory settings: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const inventoryData = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const validatedData = {
      autoDeductOnOrder: Boolean(inventoryData.autoDeductOnOrder),
      lowStockThreshold: Math.max(0, Math.min(1000, parseInt(inventoryData.lowStockThreshold) || 10)),
      autoDisableLowStock: Boolean(inventoryData.autoDisableLowStock),
      allowNegativeStock: Boolean(inventoryData.allowNegativeStock)
    };

    if (validatedData.allowNegativeStock && validatedData.autoDisableLowStock) {
      return NextResponse.json({
        success: false,
        error: 'Cannot allow negative stock while auto-disabling low stock items'
      }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!(user as any).settings) (user as any).settings = {};
    (user as any).settings.inventory = validatedData;
    user.markModified('settings');
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Inventory settings updated successfully',
      data: validatedData
    });
  } catch (error: any) {
    console.error('[DEBUG] Error updating inventory settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update inventory settings: ' + error.message }, { status: 500 });
  }
}
