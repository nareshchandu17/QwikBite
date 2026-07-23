export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit, getRateLimitIdentifier, RateLimitPresets } from '@/lib/security/rateLimiter';
import { sanitizeString, sanitizeObject } from '@/lib/security/sanitizer';

// Settings schema for database
interface ISettings {
  userId: string;
  workflow: {
    autoMoveToPreparing: boolean;
    maxPrepTimeMinutes: number;
    autoFlagDelayed: boolean;
    allowAdminCancel: boolean;
  };
  inventory: {
    autoDeductOnOrder: boolean;
    lowStockThreshold: number;
    autoDisableLowStock: boolean;
    allowNegativeStock: boolean;
  };
  staff: {
    roleBasedAccess: boolean;
    allowStaffCancel: boolean;
  };
  notifications: {
    newOrderEmail: boolean;
    delayedOrderEmail: boolean;
    lowStockEmail: boolean;
    paymentFailureEmail: boolean;
    pushNotifications: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    autoLockMinutes: number;
    sessionTimeoutMinutes: number;
  };
  system: {
    maintenanceMode: boolean;
    maxOrdersPerHour: number;
    enableAnalytics: boolean;
    enableDebugMode: boolean;
  };
  appearance: {
    theme: string;
    primaryColor: string;
    compactMode: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionDays: number;
  };
}

// GET /api/admin/settings - Load settings
export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
    const userRole = (session.user as { role?: string }).role;
    if (!['admin', 'canteen_staff'].includes(userRole as any)) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    // Rate limiting
    const identifier = getRateLimitIdentifier(req as Request);
    const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.LENIENT.limit, RateLimitPresets.LENIENT.windowMs);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await connectDB();

    // Get user profile data
    const user = await User.findById(session.user.id).select('name email phone role profilePic settings');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get settings from user's settings field or use defaults
    const userProfile = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      avatar: user.profilePic || '',
      lastLogin: new Date().toISOString()
    };

    // Default settings
    const defaultSettingsData = {
      workflow: {
        autoMoveToPreparing: false,
        maxPrepTimeMinutes: 15,
        autoFlagDelayed: false,
        allowAdminCancel: false
      },
      inventory: {
        autoDeductOnOrder: false,
        lowStockThreshold: 10,
        autoDisableLowStock: false,
        allowNegativeStock: false
      },
      staff: {
        roleBasedAccess: false,
        allowStaffCancel: false
      },
      notifications: {
        newOrderEmail: false,
        delayedOrderEmail: false,
        lowStockEmail: false,
        paymentFailureEmail: false,
        pushNotifications: false
      },
      security: {
        twoFactorAuth: false,
        autoLockMinutes: 15,
        sessionTimeoutMinutes: 60
      },
      system: {
        maintenanceMode: false,
        maxOrdersPerHour: 50,
        enableAnalytics: false,
        enableDebugMode: false
      },
      appearance: {
        theme: 'dark',
        primaryColor: '#FF512F',
        compactMode: false
      },
      backup: {
        autoBackup: false,
        backupFrequency: 'daily',
        retentionDays: 30
      }
    };

    // Merge with user's saved settings if they exist
    const userSettings = (user as any).settings || {};
    const backupSettings = userSettings.data || userSettings.backup || defaultSettingsData.backup;
    const mergedSettings = {
      ...defaultSettingsData,
      ...userSettings,
      backup: backupSettings,
      data: backupSettings
    };

    return NextResponse.json({
      success: true,
      data: {
        profile: userProfile,
        settings: mergedSettings
      }
    });
  } catch (error: unknown) {
    console.error('Error loading settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load settings'
    }, { status: 500 });
  }
}

// PUT /api/admin/settings - Save settings
export async function PUT(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
    const userRole = (session.user as { role?: string }).role;
    if (!['admin', 'canteen_staff'].includes(userRole as any)) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    // Rate limiting
    const identifier = getRateLimitIdentifier(req as Request);
    const rateLimitResult = checkRateLimit(identifier, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await connectDB();
    const body = await req.json();

    // Sanitize inputs
    const sanitizedBody = sanitizeObject(body);

    const { section, data } = sanitizedBody;

    if (!section || !data) {
      return NextResponse.json({
        success: false,
        error: 'Section and data are required'
      }, { status: 400 });
    }

    // Get user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize settings if not exists
    if (!(user as any).settings) {
      (user as any).settings = {};
    }

    // Update the specific section (and sync data/backup if applicable)
    if (section === 'data' || section === 'backup') {
      (user as any).settings.data = data;
      (user as any).settings.backup = data;
    } else {
      (user as any).settings[section] = data;
    }

    // Handle profile updates specially
    if (section === 'profile') {
      if (data.name) user.name = sanitizeString(data.name);
      if (data.phone) user.phone = sanitizeString(data.phone);
      if (data.avatar) user.profilePic = data.avatar;
      if (data.email && data.email !== user.email) {
        const existingUser = await User.findOne({ email: sanitizeString(data.email), _id: { $ne: user._id } });
        if (existingUser) {
          return NextResponse.json({ success: false, error: 'Email is already in use by another account' }, { status: 400 });
        }
        user.email = sanitizeString(data.email);
      }
    }

    user.markModified('settings');
    await user.save();

    return NextResponse.json({
      success: true,
      message: `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`,
      data: {
        section: section,
        saved: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[DEBUG] Error saving settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save settings: ' + error.message
    }, { status: 500 });
  }
}
