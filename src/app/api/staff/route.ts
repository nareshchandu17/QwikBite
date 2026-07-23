import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Staff, IStaff } from '@/models/staff.model';
import { NextRequest } from 'next/server';
import { MongoError } from 'mongodb';
import { verifyAuth, createSecureResponse } from '@/lib/middleware/auth';
import RateLimiter from '@/lib/middleware/rateLimiter';
import StaffValidator from '@/lib/validation/staffValidator';
import AuditService from '@/lib/services/auditService';
import CacheService from '@/lib/services/cacheService';
import { pusherServer } from '@/lib/pusher';

// Connect to the database
await connectDB();

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
  requestHeaders.set('x-user-id', authResult.user!.id);
  requestHeaders.set('x-user-email', authResult.user!.email);
  requestHeaders.set('x-user-role', authResult.user!.role);

  // Create new request with auth headers
  const authenticatedRequest = new NextRequest(request.url, {
    method: request.method,
    headers: requestHeaders,
    body: request.body,
    duplex: 'half',
  } as any);

  // Call the handler
  const response = await handler(authenticatedRequest);

  // Add rate limit headers to the response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// GET /api/staff - Get all staff members with pagination
export async function GET(request: NextRequest) {
  return withSecurity(request, async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    // Check cache first
    const cachedData: any = CacheService.getCachedStaffList(page, limit, search, role, status);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        pagination: cachedData.pagination,
        cached: true
      });
    }

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }

    // Execute queries in parallel
    const [staff, total] = await Promise.all([
      Staff.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      Staff.countDocuments(query)
    ]);

    const result = {
      data: staff,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    // Cache the result
    CacheService.cacheStaffList(result, page, limit, search, role, status);

    return NextResponse.json({
      success: true,
      ...result,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
  });
}

// POST /api/staff - Create a new staff member
export async function POST(request: NextRequest) {
  return withSecurity(request, async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    // Validate and sanitize input
    const validation = StaffValidator.validateStaffData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    const sanitizedData: any = validation.sanitized!;

    // Check if staff with email already exists
    const existingStaff = await Staff.findOne({ 
      email: sanitizedData.email
    });
    if (existingStaff) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A staff member with this email already exists',
          field: 'email'
        },
        { status: 409 }
      );
    }

    // Create new staff with additional fields
    const staffData = {
        ...sanitizedData,
        phone: sanitizedData.contact || sanitizedData.phone, // Map contact to phone
        avatar: sanitizedData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedData.name)}&background=random`,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const staff: IStaff = await Staff.create(staffData);

    // Invalidate cache
    CacheService.invalidateStaffCache();

    // Log the action (audit trail)
    await AuditService.logStaffAction(
      'CREATE',
      staff._id?.toString() || '',
      staff.name,
      req.headers.get('x-user-id')!,
      req.headers.get('x-user-email')!,
      req.headers.get('x-user-role')!,
      { before: null, after: staffData },
      req,
      `Staff member ${staff.name} created`
    );

    console.log(`Staff created: ${staff.name} by ${req.headers.get('x-user-email')}`);

    // Emit real-time notification to admins
    try {
      await pusherServer.trigger('admin', 'staff_update', {
        type: 'staff_created',
        staff: {
          _id: staff._id,
          ...staffData
        },
        timestamp: new Date()
      });
    } catch (pusherError) {
      console.error('Failed to send Pusher notification:', pusherError);
      // Don't fail the request if Pusher fails
    }

    // Return success response with created staff data
    return NextResponse.json({
      success: true,
      message: 'Staff added successfully',
      data: {
        _id: staff._id,
        ...staffData
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating staff:', error);
    
    // Handle duplicate key error (MongoDB E11000)
    if (error instanceof MongoError && error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A staff member with this email already exists',
          field: 'email'
        },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.message
        },
        { status: 400 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred while adding staff',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
  });
}
