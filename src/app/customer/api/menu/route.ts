export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db';
import { MenuItem } from '@/lib/models/MenuItem';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const category = url.searchParams.get('category') || ''

    // Build query
    const query: any = { available: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'All' && category !== 'all') {
      query.category = { $regex: category, $options: 'i' };
    }

    // Fetch items from database
    const items = await MenuItem.find(query).sort({ category: 1, name: 1 });

    return NextResponse.json({ status: 'success', data: { menuItems: items } });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}
