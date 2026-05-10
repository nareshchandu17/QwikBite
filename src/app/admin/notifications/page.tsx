'use client';

import { useState, useCallback } from 'react';
import { Bell, Send, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const notificationTypes = [
  { value: 'order', label: 'Order Update' },
  { value: 'offer', label: 'Special Offer' },
  { value: 'feedback', label: 'Feedback Request' },
  { value: 'system', label: 'System Message' }
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' }
];

const icons = [
  { value: 'bell', label: '🔔 Bell' },
  { value: 'star', label: '⭐ Star' },
  { value: 'gift', label: '🎁 Gift' },
  { value: 'warning', label: '⚠️ Warning' },
  { value: 'info', label: 'ℹ️ Info' },
  { value: 'success', label: '✅ Success' }
];

const AdminNotificationsPage = () => {
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'system',
    priority: 'normal',
    icon: 'bell',
    userId: '',
    ctaLink: ''
  });
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<unknown[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNotificationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendNotification = useCallback(async () => {
    if (!notificationData.title || !notificationData.message) {
      toast.error('Title and message are required');
      return;
    }

    if (!isBroadcast && !notificationData.userId) {
      toast.error('Please enter a customer ID or select broadcast');
      return;
    }

    try {
      setIsLoading(true);

      const endpoint = isBroadcast 
        ? '/api/admin/notifications/send'
        : '/api/admin/notifications/send';

      const method = isBroadcast ? 'PUT' : 'POST';

      const payload = isBroadcast
        ? {
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            priority: notificationData.priority,
            icon: notificationData.icon,
            ctaLink: notificationData.ctaLink || undefined
          }
        : {
            userId: notificationData.userId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            priority: notificationData.priority,
            icon: notificationData.icon,
            ctaLink: notificationData.ctaLink || undefined
          };

      const response = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send notification');
      }

      const result = await response.json();
      toast.success(result.message || 'Notification sent successfully!');

      // Add to recent notifications list
      setRecentNotifications(prev => [
        {
          id: Date.now(),
          ...notificationData,
          isBroadcast,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev
      ].slice(0, 5));

      // Reset form
      setNotificationData({
        title: '',
        message: '',
        type: 'system',
        priority: 'normal',
        icon: 'bell',
        userId: '',
        ctaLink: ''
      });
    } catch (error: unknown) {
      console.error('Failed to send notification:', error);
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  }, [notificationData, isBroadcast]);

  const handleClear = () => {
    setNotificationData({
      title: '',
      message: '',
      type: 'system',
      priority: 'normal',
      icon: 'bell',
      userId: '',
      ctaLink: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">Send Notifications</h1>
          </div>
          <p className="text-slate-400">Send real-time notifications to customers</p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="bg-slate-800 border-slate-700 shadow-xl">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white">Notification Form</CardTitle>
                <CardDescription className="text-slate-400">
                  Compose and send a notification to customers
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Recipient Type Toggle */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isBroadcast}
                      onChange={() => setIsBroadcast(false)}
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="text-slate-300">Send to Specific Customer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isBroadcast}
                      onChange={() => setIsBroadcast(true)}
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="text-slate-300">Broadcast to All Customers</span>
                  </label>
                </div>

                {/* Customer ID Input (if not broadcast) */}
                {!isBroadcast && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Customer ID
                    </label>
                    <input
                      type="text"
                      name="userId"
                      value={notificationData.userId}
                      onChange={handleInputChange}
                      placeholder="Enter customer MongoDB ID"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={notificationData.title}
                    onChange={handleInputChange}
                    placeholder="Notification title"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={notificationData.message}
                    onChange={handleInputChange}
                    placeholder="Notification message"
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Type, Priority, Icon Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Type
                    </label>
                    <select
                      name="type"
                      value={notificationData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {notificationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={notificationData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Icon
                    </label>
                    <select
                      name="icon"
                      value={notificationData.icon}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {icons.map(icon => (
                        <option key={icon.value} value={icon.value}>
                          {icon.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CTA Link */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    CTA Link (Optional)
                  </label>
                  <input
                    type="url"
                    name="ctaLink"
                    value={notificationData.ctaLink}
                    onChange={handleInputChange}
                    placeholder="https://example.com/path"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSendNotification}
                    disabled={isLoading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Notification
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    className="px-6 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-slate-800 border-slate-700 shadow-xl">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white text-lg">Recent Sent</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {recentNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No notifications sent yet</p>
                  </div>
                ) : (
                  recentNotifications.map(notification => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-orange-500 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm truncate">
                            {notification.title}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {notification.isBroadcast ? 'Broadcast' : `ID: ${notification.userId.slice(0, 8)}...`}
                          </p>
                        </div>
                        <span className="text-slate-500 text-xs whitespace-nowrap">
                          {notification.timestamp}
                        </span>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="inline-block px-2 py-1 bg-slate-600 text-slate-200 text-xs rounded">
                          {notification.type}
                        </span>
                        <span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${
                          notification.priority === 'high' ? 'bg-red-900 text-red-200' :
                          notification.priority === 'normal' ? 'bg-blue-900 text-blue-200' :
                          'bg-green-900 text-green-200'
                        }`}>
                          {notification.priority}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
