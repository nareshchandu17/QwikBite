import { NextResponse } from 'next/server';
import { menuItems } from '@/data/menu';

export async function GET() {
  try {
    // Extract unique tags from all menu items
    const allTags = menuItems.flatMap(item => item.tags);
    const uniqueTags = Array.from(new Set(allTags)).sort();
    
    return NextResponse.json(uniqueTags);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
