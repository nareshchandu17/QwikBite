import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Inventory from "@/lib/models/Inventory";

// GET – Fetch all inventory
export async function GET() {
  try {
    await connectToDatabase();
    const items = await Inventory.find().sort({ updatedAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST – Add new item
export async function POST(req: Request) {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name || !body.category || body.quantity === undefined || !body.unit) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['name', 'category', 'quantity', 'unit'],
          received: Object.keys(body)
        },
        { status: 400 }
      );
    }

    // Create the inventory item
    try {
      const item = await Inventory.create({
        ...body,
        lastUpdated: new Date(),
        status: body.quantity > 0 ? 'In_Stock' : 'Out_of_Stock'
      });

      // Convert Mongoose document to plain object
      const itemObject = item.toObject();

      return NextResponse.json(itemObject, { status: 201 });
    } catch (error) {
      console.error('Database error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      const errorCode = error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : 'UNKNOWN_ERROR';

      return NextResponse.json(
        {
          error: 'Failed to create inventory item',
          details: errorMessage,
          code: errorCode
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in API route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}

// PUT – Restock / update
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const { id, quantity, status, unit } = await req.json();

    if (!id || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: id and quantity are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      $inc: { quantity },
      lastUpdated: new Date(),
    };

    if (status) {
      updateData.$set = updateData.$set || {};
      updateData.$set.status = status;
    }

    if (unit) {
      updateData.$set = updateData.$set || {};
      updateData.$set.unit = unit;
    }

    const updated = await Inventory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
