import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { name, regNo, email, password, role } = body;

    // Validate input
    if (!name || !regNo || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Connect to MongoDB using Mongoose
    await connectDB();
    console.log('[signup] Connected to MongoDB via Mongoose');

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { regNo: regNo.trim() }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or registration number already exists' },
        { status: 400 }
      );
    }

    // Create user using Mongoose model
    // Note: Password hashing is handled by the User model's pre-save hook
    const newUser = await User.create({
      name: name.trim(),
      regNo: regNo.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: (role || 'customer').toLowerCase(),
    });

    console.log('[signup] User created:', newUser._id);

    // Generate JWT token
    const token = generateToken({
      id: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      regNo: newUser.regNo
    });

    // Create response
    const response = NextResponse.json({
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        regNo: newUser.regNo
      },
      message: 'User created successfully'
    }, { status: 201 });

    // Set HTTP-only cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    });

    return response;

  } catch (error: any) {
    console.error('[signup] Error:', error);

    // Check for Mongoose duplicate key error (code 11000)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email or registration number already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'An error occurred while creating your account' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
