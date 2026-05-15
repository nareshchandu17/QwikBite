export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
import { Types } from 'mongoose';

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  preferences: {
    defaultPayment: string;
    language: string;
    remindBeforeLunch: boolean;
    autoRefreshOrderStatus: boolean;
  };
}

interface UserResponse {
  _id: Types.ObjectId;
  settings?: UserSettings;
}


type SettingsData = {
  notifications: {
    email: boolean;
    push: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  preferences: {
    defaultPayment: string;
    language: string;
    remindBeforeLunch: boolean;
    autoRefreshOrderStatus: boolean;
  };
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

    await connectToDatabase();
    
    const user = await User.findOne(
      { email: session.user.email },
      'settings'
    ).lean<UserResponse>().exec();

    const defaultSettings: SettingsData = {
      notifications: {
        email: true,
        push: false,
        orderUpdates: true,
        promotions: false,
      },
      preferences: {
        defaultPayment: 'Pay on Pickup',
        language: 'English',
        remindBeforeLunch: true,
        autoRefreshOrderStatus: false,
      },
    };

    return NextResponse.json({
      success: true,
      settings: user?.settings || defaultSettings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
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

    const settingsData: UserSettings = await request.json();

    await connectToDatabase();
    
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          settings: settingsData,
        },
      },
      {
        new: true,
        upsert: true,
      }
    ).exec();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
