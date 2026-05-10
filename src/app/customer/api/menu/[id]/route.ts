import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db';
import { MenuItem } from '@/lib/models/MenuItem';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    
    const item = await MenuItem.findOne({ id });
    
    if (!item) {
      return NextResponse.json(
        { status: 'error', message: 'Menu item not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({ status: 'success', data: { menuItem: item } });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch menu item' },
      { status: 500 }
    );
  }
}