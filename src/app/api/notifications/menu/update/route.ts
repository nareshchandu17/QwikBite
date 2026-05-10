/**
 * POST /api/notifications/menu/update
 * 
 * Called when menu items are added, updated, or deleted
 * Notifies all customers about menu changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import NotificationService from '@/lib/services/notification.service';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { action, itemName, category, message } = await req.json();

    if (!action || !itemName) {
      return NextResponse.json(
        { error: 'action and itemName are required' },
        { status: 400 }
      );
    }

    const actionMessages: { [key: string]: { title: string; icon: string } } = {
      'add': {
        title: '✨ New Item Added',
        icon: '✨'
      },
      'update': {
        title: '📝 Menu Item Updated',
        icon: '📝'
      },
      'remove': {
        title: '🗑️ Item Removed',
        icon: '🗑️'
      }
    };

    const actionInfo = actionMessages[action] || {
      title: '📋 Menu Updated',
      icon: '📋'
    };

    // Notify all customers
    await NotificationService.notifyAllCustomers({
      title: actionInfo.title,
      message: message || `${itemName}${category ? ` (${category})` : ''} has been ${action}d from our menu`,
      type: 'menu',
      priority: 'normal',
      icon: actionInfo.icon,
      data: {
        itemName,
        category,
        action,
        timestamp: new Date().toISOString()
      },
      ctaLink: '/customer/menu'
    });

    return NextResponse.json({
      success: true,
      message: 'Menu update notification sent to all customers'
    });
  } catch (error) {
    console.error('[Menu Notification API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
