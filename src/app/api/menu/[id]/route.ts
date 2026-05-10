import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { MenuItem } from '@/lib/models';
import mongoose from 'mongoose';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const jsonResponse = (data: unknown, status = 200) => {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonResponse({ error: 'Invalid id' }, 400);
    }
    
    const item = await MenuItem.findById(id).lean();
    if (!item) return jsonResponse({ error: 'Not found' }, 404);
    
    return jsonResponse({ data: item });
  } catch (err) {
    console.error('GET /api/menu/[id] error:', err);
    return jsonResponse({ error: 'Failed to fetch menu item' }, 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await request.json().catch(() => ({}));

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonResponse({ error: 'Invalid id' }, 400);
    }

    const updated = await MenuItem.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
    if (!updated) return jsonResponse({ error: 'Not found' }, 404);

    return jsonResponse(updated);
  } catch (err) {
    console.error('PATCH /api/menu/[id] error:', err);
    return jsonResponse({ error: 'Failed to update menu item' }, 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonResponse({ error: 'Invalid id' }, 400);
    }

    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted) return jsonResponse({ error: 'Not found' }, 404);

    return jsonResponse({ message: 'deleted', deleted });
  } catch (err) {
    console.error('DELETE /api/menu/[id] error:', err);
    return jsonResponse({ error: 'Failed to delete menu item' }, 500);
  }
}
