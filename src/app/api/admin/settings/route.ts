import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Mock settings data - in a real app, this would come from a database
const defaultSettings = {
  profile: {
    name: 'Admin User',
    email: 'admin@qwikbite.com',
    phone: '+1234567890',
    role: 'Super Admin',
    avatar: '',
    lastLogin: new Date().toISOString()
  },
  settings: {
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
  }
};

// GET /api/admin/settings - Load settings
export async function GET(req: NextRequest) {
  try {
    console.log('[DEBUG] Loading admin settings...');
    
    // Get user session to fetch real profile data
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
    const session = await getServerSession(authOptions);
    
    // In a real app, you would fetch from database
    // For now, return settings with real user data if available
    const profileData = session?.user ? {
      name: session.user.name || 'Admin User',
      email: session.user.email || 'admin@qwikbite.com',
      phone: '+1234567890', // This would come from database
      role: session.user.role || 'Super Admin',
      avatar: session.user.image || '',
      lastLogin: new Date().toISOString()
    } : {
      name: 'Admin User',
      email: 'admin@qwikbite.com',
      phone: '+1234567890',
      role: 'Super Admin',
      avatar: '',
      lastLogin: new Date().toISOString()
    };

    const settingsData = {
      success: true,
      data: {
        profile: profileData,
        settings: {
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
        }
      }
    };

    console.log('[DEBUG] Settings data structure:', JSON.stringify(settingsData, null, 2));
    
    return NextResponse.json(settingsData);
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
    const { section, data } = await req.json();

    console.log('[DEBUG] Saving settings for section:', section);
    console.log('[DEBUG] Settings data:', data);

    if (!section || !data) {
      return NextResponse.json({
        success: false,
        error: 'Section and data are required'
      }, { status: 400 });
    }

    // Handle profile updates specially
    if (section === 'profile') {
      // In a real app, you would update the user in the database
      console.log('[DEBUG] Updating user profile:', data);
      
      // For demo purposes, just simulate the update
      // In production, you would:
      // 1. Validate the data
      // 2. Update user in database
      // 3. Update session if needed
      // 4. Handle password changes separately
    }

    // Handle workflow updates specially
    if (section === 'workflow') {
      // In a real app, you would update workflow settings in database
      console.log('[DEBUG] Updating workflow settings:', data);
      
      // For demo purposes, just simulate the update
      // In production, you would:
      // 1. Validate workflow rules
      // 2. Update workflow in database
      // 3. Apply changes to active orders if needed
    }

    // Handle inventory updates specially
    if (section === 'inventory') {
      // In a real app, you would update inventory settings in database
      console.log('[DEBUG] Updating inventory settings:', data);
      
      // For demo purposes, just simulate the update
      // In production, you would:
      // 1. Validate inventory rules
      // 2. Update inventory in database
      // 3. Check current stock levels and update availability
      // 4. Apply auto-deduct rules if enabled
    }

    // Handle staff updates specially
    if (section === 'staff') {
      // In a real app, you would update staff settings in database
      console.log('[DEBUG] Updating staff settings:', data);
      
      // For demo purposes, just simulate the update
      // In production, you would:
      // 1. Validate staff permission rules
      // 2. Update staff settings in database
      // 3. Update active staff sessions if needed
      // 4. Notify staff of permission changes
    }

    // Handle notifications updates specially
    if (section === 'notifications') {
      // In a real app, you would update notification settings in database
      console.log('[DEBUG] Updating notification settings:', data);
      
      // For demo purposes, just simulate the update
      // In production, you would:
      // 1. Validate notification preferences
      // 2. Update notification settings in database
      // 3. Update email subscription lists
      // 4. Configure push notification services
    }

    // Handle security updates specially
    if (section === 'security') {
      // In a real app, you would update security settings in database
      console.log('[DEBUG] Updating security settings:', data);
      
      // For demo purposes, just simulate the update
      // In production, you would:
      // 1. Validate security rules
      // 2. Update security settings in database
      // 3. Update authentication middleware
      // 4. Configure 2FA if enabled
      // 5. Update session management
    }

    // Handle system updates specially
    if (section === 'system') {
      // In a real app, you would update system settings in database
      console.log('[DEBUG] Updating system settings:', data);
      
      // For demo purposes, just simulate the update
      // In production, you would:
      // 1. Validate system rules
      // 2. Update system settings in database
      // 3. Apply maintenance mode if enabled
      // 4. Update analytics configuration
      // 5. Configure debug logging
    }

    // Handle data updates specially
    if (section === 'data') {
      // In a real app, you would update data settings in database
      console.log('[DEBUG] Updating data settings:', data);
      
      // For demo purposes, just simulate the update
      // In production, you would:
      // 1. Validate backup settings
      // 2. Update backup configuration
      // 3. Configure backup schedules
      // 4. Update retention policies
      // 5. Test backup connectivity
    }

    // Note: Danger zone actions are handled separately via POST to /api/admin/settings/danger

    // Handle other settings sections
    console.log(`[DEBUG] Successfully saved settings for section: ${section}`);

    // Simulate saving delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`,
      data: {
        section: section,
        saved: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: unknown) {
    console.error('[DEBUG] Error saving settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save settings: ' + error.message
    }, { status: 500 });
  }
}
