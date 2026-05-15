/**
 * Admin Notifications Component
 * Displays real-time notifications for orders, payments, and feedback
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Package, CreditCard, MessageSquare, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useWebSocket } from '@/context/WebSocketContext';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'feedback' | 'system' | 'alert';
  priority: 'low' | 'normal' | 'high';
  icon: string;
  data?: any;
  ctaLink?: string;
  timestamp: Date;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const { socket, isConnected } = useWebSocket();

  const getIconComponent = (type: string, icon: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'feedback':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Listen for WebSocket notifications
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('[AdminNotifications] ⚠️ WebSocket not ready');
      return;
    }

    console.log('[AdminNotifications] 🔌 Setting up WebSocket listeners');

    const handleAdminNotification = (data: any) => {
      console.log('[AdminNotifications] 📡 Received notification:', data);
      
      const newNotification: AdminNotification = {
        id: Date.now().toString(),
        title: data.title || 'Notification',
        message: data.message || '',
        type: data.type || 'system',
        priority: data.priority || 'normal',
        icon: data.icon || '🔔',
        data: data.data,
        ctaLink: data.ctaLink,
        timestamp: new Date(data.timestamp || Date.now())
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      const toastMessage = `${data.title}: ${data.message}`;
      if (data.priority === 'high') {
        toast.error(toastMessage);
      } else {
        toast.info(toastMessage);
      }
    };

    // Listen for admin notifications
    socket.on('admin_notification', handleAdminNotification);

    // Also listen for other notification types
    socket.on('order_notification', handleAdminNotification);
    socket.on('payment_notification', handleAdminNotification);
    socket.on('feedback_notification', handleAdminNotification);

    return () => {
      socket.off('admin_notification', handleAdminNotification);
      socket.off('order_notification', handleAdminNotification);
      socket.off('payment_notification', handleAdminNotification);
      socket.off('feedback_notification', handleAdminNotification);
    };
  }, [socket, isConnected]);

  const handleNotificationClick = (notification: AdminNotification) => {
    if (notification.ctaLink) {
      window.location.href = notification.ctaLink;
    }
  };

  const handleDismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Notification Bell Icon */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-16 right-0 w-96 max-h-96 bg-white rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 hover:bg-blue-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification List */}
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="border-b last:border-b-0 p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          {getIconComponent(notification.type, notification.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(notification.id);
                          }}
                          className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Connection Status */}
            <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
