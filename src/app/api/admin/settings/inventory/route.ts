import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Mock inventory settings data
const defaultInventorySettings = {
  autoDeductOnOrder: false,
  lowStockThreshold: 10,
  autoDisableLowStock: false,
  allowNegativeStock: false
};

export async function GET(req: NextRequest) {
  try {
    console.log('[DEBUG] Loading inventory settings');

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
      data: defaultInventorySettings
    });

  } catch (error: unknown) {
    console.error('[DEBUG] Error loading inventory settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load inventory settings: ' + error.message
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const inventoryData = await req.json();

    console.log('[DEBUG] Updating inventory settings:', inventoryData);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Validate inventory data
    const validatedData = {
      autoDeductOnOrder: Boolean(inventoryData.autoDeductOnOrder),
      lowStockThreshold: Math.max(0, Math.min(1000, parseInt(inventoryData.lowStockThreshold) || 10)),
      autoDisableLowStock: Boolean(inventoryData.autoDisableLowStock),
      allowNegativeStock: Boolean(inventoryData.allowNegativeStock)
    };

    // Business rule validation
    if (validatedData.allowNegativeStock && validatedData.autoDisableLowStock) {
      return NextResponse.json({
        success: false,
        error: 'Cannot allow negative stock while auto-disabling low stock items'
      }, { status: 400 });
    }

    // In a real app, you would:
    // 1. Validate business rules
    // 2. Update inventory settings in database
    // 3. Check current stock levels and update item availability if needed
    // 4. Log the settings change

    console.log('[DEBUG] Inventory settings validated:', validatedData);

    // Simulate database update
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Inventory settings updated successfully',
      data: validatedData
    });

  } catch (error: unknown) {
    console.error('[DEBUG] Error updating inventory settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update inventory settings: ' + error.message
    }, { status: 500 });
  }
}
