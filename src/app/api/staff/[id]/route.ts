import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Staff, IStaff } from '@/models/staff.model';
import { NextRequest } from 'next/server';
import { MongoError } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import StaffValidator from '@/lib/validation/staffValidator';
import { pusherServer } from '@/lib/pusher';

// Connect to the database
await connectDB();

// GET /api/staff/[id] - Get single staff member
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Basic auth check
  const session = await getServerSession(authConfig);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    
    const staff = await Staff.findOne({ 
      _id: id, 
      isDeleted: { $ne: true } 
    }).select('-__v').lean();
    
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: staff
    });
  } catch (error: any) {
    console.error('Error fetching staff member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff member' },
      { status: 500 }
    );
  }
}

// PATCH /api/staff/[id] - Update staff member
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // Basic auth check
  const session = await getServerSession(authConfig);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    
    // Check if staff exists
    const existingStaff: IStaff | null = await Staff.findOne({ 
      _id: id, 
      isDeleted: { $ne: true } 
    });
    
    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Validate and sanitize input (only validate provided fields)
    const validation = StaffValidator.validateStaffData({
      ...existingStaff.toObject(),
      ...body
    });
    
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
    
    // Check email uniqueness if email is being changed
    if (sanitizedData.email !== existingStaff.email) {
      const emailExists = await Staff.findOne({ 
        email: sanitizedData.email,
        _id: { $ne: id },
        isDeleted: { $ne: true }
      });
      
      if (emailExists) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'A staff member with this email already exists',
            field: 'email'
          },
          { status: 409 }
        );
      }
    }

    // Update staff member
    const updatedStaff = await Staff.findByIdAndUpdate(
      id,
      {
        ...sanitizedData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedStaff) {
      return NextResponse.json(
        { success: false, error: 'Failed to update staff member' },
        { status: 500 }
      );
    }

    // Log the action (audit trail)
    console.log(`Staff updated: ${updatedStaff.name} by ${request.headers.get('x-user-email')}`);

    // Emit real-time notification to admins
    try {
      await pusherServer.trigger('admin', 'staff_update', {
        type: 'staff_updated',
        staff: updatedStaff,
        timestamp: new Date()
      });
    } catch (pusherError) {
      console.error('Failed to send Pusher notification:', pusherError);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedStaff
    });

  } catch (error: any) {
    console.error('Error updating staff member:', error);
    
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
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update staff member',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] - Soft delete staff member
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Basic auth check
  const session = await getServerSession(authConfig);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    
    // Check if staff exists
    const existingStaff: IStaff | null = await Staff.findOne({ 
      _id: id, 
      isDeleted: { $ne: true } 
    });
    
    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Soft delete (mark as deleted instead of removing)
    await Staff.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    );

    // Log the action (audit trail)
    console.log(`Staff soft-deleted: ${existingStaff.name} by ${request.headers.get('x-user-email')}`);

    // Emit real-time notification to admins
    try {
      await pusherServer.trigger('admin', 'staff_update', {
        type: 'staff_deleted',
        staff: existingStaff,
        timestamp: new Date()
      });
    } catch (pusherError) {
      console.error('Failed to send Pusher notification:', pusherError);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member removed successfully'
    });

  } catch (error: any) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete staff member',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
