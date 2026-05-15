import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Staff } from '@/lib/models';

export async function POST(request: Request) {
  try {
    await connectDB();
    const staffData = await request.json();
    const newStaff = await Staff.create(staffData);
    
    return NextResponse.json({
      success: true,
      data: newStaff,
      message: 'Staff member added successfully'
    });
    
  } catch (error: any) {
    console.error('Error adding staff member:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        name: error.name,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const staff = await Staff.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ 
      success: true, 
      data: staff,
      count: staff.length
    });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
