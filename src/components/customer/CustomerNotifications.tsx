/**
 * Customer Notifications Component
 * Displays real-time notifications for orders, menu changes, and feedback
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Package, Menu, MessageSquare, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useWebSocket } from '@/context/WebSocketContext';

interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'menu' | 'feedback' | 'system' | 'alert';
  priority: 'low' | 'normal' | 'high';
  icon: string;
  data?: unknown;
  ctaLink?: string;
  timestamp: Date;
}

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const { socket, isConnected } = useWebSocket();

  const getIconComponent = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'menu':
        return <Menu className="w-5 h-5 text-orange-500" />;
      case 'feedback':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'alert':
        return <Zap className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Listen for WebSocket notifications
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('[CustomerNotifications] ⚠️ WebSocket not ready');
      return;
    }

    console.log('[CustomerNotifications] 🔌 Setting up WebSocket listeners');

    const handleNotification = (data: any) => {
      console.log('[CustomerNotifications] 📡 Received notification:', data);
      
      const newNotification: CustomerNotification = {
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
        toast.success(toastMessage);
      } else {
        toast.info(toastMessage);
      }

      // Play sound for high priority notifications
      if (data.priority === 'high') {
        try {
          const audio = new Audio('/notification-sound.mp3');
          audio.play().catch(() => {
            // Silently fail if audio can&apos;t play
            console.log('[CustomerNotifications] Audio play failed');
          });
        } catch (err) {
          console.log('[CustomerNotifications] Sound notification error:', err);
        }
      }
    };

    // Listen for different notification types
    socket.on('new_notification', handleNotification);
    socket.on('order_status', handleNotification);
    socket.on('menu_update', handleNotification);
    socket.on('feedback_reply', handleNotification);

    return () => {
      socket.off('new_notification', handleNotification);
      socket.off('order_status', handleNotification);
      socket.off('menu_update', handleNotification);
      socket.off('feedback_reply', handleNotification);
    };
  }, [socket, isConnected]);

  const handleNotificationClick = (notification: CustomerNotification) => {
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
        initial={false}
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
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
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Your Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm bg-green-500 hover:bg-green-600 px-3 py-1 rounded transition-colors"
                >
                  Mark all
                </button>
              )}
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 hover:bg-green-600 rounded transition-colors"
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
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="border-b last:border-b-0 p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 pt-1">
                          {getIconComponent(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(notification.id);
                          }}
                          className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Connection Status */}
            <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600 flex items-center gap-2 border-t">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
