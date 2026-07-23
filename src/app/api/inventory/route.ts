import { NextResponse, NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import Inventory from "@/lib/models/Inventory";
import { verifyAuth, createSecureResponse } from "@/lib/middleware/auth";
import RateLimiter from "@/lib/middleware/rateLimiter";
import { pusherServer } from "@/lib/pusher";

// Connect to the database
await connectToDatabase();

// Rate limiter instance
const rateLimiter = RateLimiter.getInstance(50, 15 * 60 * 1000);

// Security middleware wrapper
async function withSecurity(request: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) {
  // Apply rate limiting
  const rateLimitResult = rateLimiter.isAllowed(request);
  const headers = rateLimiter.createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }

  // Apply authentication
  const authResult = await verifyAuth(request);
  
  if (!authResult.success) {
    return createSecureResponse(authResult, 401);
  }

  // Add user info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  if (authResult.user) {
    requestHeaders.set('x-user-id', authResult.user.id);
    requestHeaders.set('x-user-role', authResult.user.role);
  }

  // Create authenticated request for the handler
  const authenticatedRequest = new NextRequest(request.url, {
    method: request.method,
    headers: requestHeaders,
    body: request.body,
    duplex: 'half',
  } as any);

  return handler(authenticatedRequest);
}

// GET – Fetch all inventory
export async function GET(request: NextRequest) {
  return withSecurity(request, async (req) => {
    try {
      const items = await Inventory.find().sort({ updatedAt: -1 });
      return NextResponse.json(items);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventory', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  });
}

// POST – Add new item
export async function POST(request: NextRequest) {
  return withSecurity(request, async (req) => {
    try {
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

        // Emit real-time notification to admins
        try {
          await pusherServer.trigger('admin', 'inventory_update', {
            type: 'item_created',
            item: itemObject,
            timestamp: new Date()
          });
        } catch (pusherError) {
          console.error('Failed to send Pusher notification:', pusherError);
          // Don't fail the request if Pusher fails
        }

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
  });
}

// PUT – Restock / update
export async function PUT(request: NextRequest) {
  return withSecurity(request, async (req) => {
    try {
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

      // Emit real-time notification to admins
      try {
        await pusherServer.trigger('admin', 'inventory_update', {
          type: 'item_updated',
          item: updated,
          timestamp: new Date()
        });
      } catch (pusherError) {
        console.error('Failed to send Pusher notification:', pusherError);
        // Don't fail the request if Pusher fails
      }

      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return NextResponse.json(
        { error: 'Failed to update inventory item', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  });
}

// DELETE – Remove inventory item
export async function DELETE(request: NextRequest) {
  return withSecurity(request, async (req) => {
    try {
      const { id } = await req.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Missing required field: id is required' },
          { status: 400 }
        );
      }

      const deleted = await Inventory.findByIdAndDelete(id);

      if (!deleted) {
        return NextResponse.json(
          { error: 'Inventory item not found' },
          { status: 404 }
        );
      }

      // Emit real-time notification to admins
      try {
        await pusherServer.trigger('admin', 'inventory_update', {
          type: 'item_deleted',
          item: deleted,
          timestamp: new Date()
        });
      } catch (pusherError) {
        console.error('Failed to send Pusher notification:', pusherError);
        // Don't fail the request if Pusher fails
      }

      return NextResponse.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return NextResponse.json(
        { error: 'Failed to delete inventory item', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  });
}
