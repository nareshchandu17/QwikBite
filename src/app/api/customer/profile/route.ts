export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Types } from 'mongoose';
import { sanitizeName, sanitizeEmail, sanitizePhone, sanitizeString } from '@/lib/security/sanitizer';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';

interface UserProfile {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  regNo?: string;
  profilePic?: string;
  role: string;
}

type UserProfileResponse = Omit<UserProfile, '_id' | 'profilePic'> & { 
  id: string;
  image: string;
};

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const user = await User.findOne(
      { email: session.user.email },
      'name email phone regNo profilePic role'
    ).lean<UserProfile>().exec();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userResponse: UserProfileResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      regNo: user.regNo || '',
      image: user.profilePic || '',
      role: user.role || 'customer',
    };

    return NextResponse.json({ 
      success: true, 
      user: userResponse
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, phone, regNo } = body;

    // Sanitize inputs
    const sanitizedName = sanitizeName(name);
    const sanitizedPhone = sanitizePhone(phone);
    const sanitizedRegNo = regNo ? sanitizeString(regNo) : '';

    if (!sanitizedName || !sanitizedPhone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const updateData: Partial<UserProfile> = {
      name: sanitizedName,
      phone: sanitizedPhone,
    };

    if (sanitizedRegNo) {
      updateData.regNo = sanitizedRegNo;
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      {
        new: true,
        projection: 'name email phone regNo profilePic role',
      }
    ).lean<UserProfile>().exec();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const updatedUserResponse: UserProfileResponse = {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      regNo: updatedUser.regNo || '',
      image: updatedUser.profilePic || '',
      role: updatedUser.role || 'customer',
    };

    return NextResponse.json({ 
      success: true, 
      user: updatedUserResponse 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
