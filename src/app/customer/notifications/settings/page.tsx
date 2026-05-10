'use client';

import { useState } from 'react';
import { ArrowLeft, Bell, BellOff, Clock, ShoppingBag, Tag, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type NotificationPreference = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  category: 'orders' | 'offers' | 'feedback' | 'system';
};

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'order-updates',
      label: 'Order Updates',
      description: 'Get notified when your order status changes',
      icon: <ShoppingBag className="h-5 w-5 text-amber-500" />,
      enabled: true,
      category: 'orders'
    },
    {
      id: 'ready-for-pickup',
      label: 'Ready for Pickup',
      description: 'Get notified when your order is ready',
      icon: <Bell className="h-5 w-5 text-green-500" />,
      enabled: true,
      category: 'orders'
    },
    {
      id: 'exclusive-offers',
      label: 'Exclusive Offers',
      description: 'Receive special offers and discounts',
      icon: <Tag className="h-5 w-5 text-blue-500" />,
      enabled: true,
      category: 'offers'
    },
    {
      id: 'feedback-requests',
      label: 'Feedback Requests',
      description: 'Get notified to provide feedback on your orders',
      icon: <MessageSquare className="h-5 w-5 text-purple-500" />,
      enabled: true,
      category: 'feedback'
    },
    {
      id: 'system-updates',
      label: 'System Updates',
      description: 'Important updates about the canteen service',
      icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
      enabled: true,
      category: 'system'
    },
    {
      id: 'promotional',
      label: 'Promotional Content',
      description: 'Special deals and promotions from the canteen',
      icon: <Tag className="h-5 w-5 text-pink-500" />,
      enabled: true,
      category: 'offers'
    },
  ]);

  const [doNotDisturb, setDoNotDisturb] = useState({
    enabled: false,
    startTime: '22:00',
    endTime: '07:00'
  });

  const togglePreference = (id: string) => {
    setPreferences(preferences.map(pref => 
      pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
    ));
  };

  const toggleAll = (category: 'all' | 'orders' | 'offers' | 'feedback' | 'system', enabled: boolean) => {
    if (category === 'all') {
      setPreferences(preferences.map(pref => ({ ...pref, enabled })));
    } else {
      setPreferences(preferences.map(pref => 
        pref.category === category ? { ...pref, enabled } : pref
      ));
    }
  };

  const getCategoryCount = (category: string) => {
    return preferences.filter(p => p.category === category).length;
  };

  const getEnabledCount = (category: string) => {
    return preferences.filter(p => p.category === category && p.enabled).length;
  };

  const categories = [
    { id: 'orders', label: 'Orders', icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 'offers', label: 'Offers', icon: <Tag className="h-4 w-4" /> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'system', label: 'System', icon: <AlertCircle className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customize how you receive notifications
              </p>
            </div>
          </div>
        </div>

        {/* Do Not Disturb */}
        <Card className="mb-8 border-amber-100 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <BellOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-medium">Do Not Disturb</CardTitle>
                  <CardDescription className="text-sm">
                    Silence notifications during specific hours
                  </CardDescription>
                </div>
              </div>
              <Switch 
                checked={doNotDisturb.enabled}
                onCheckedChange={(checked) => setDoNotDisturb({ ...doNotDisturb, enabled: checked })}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </CardHeader>
          {doNotDisturb.enabled && (
            <CardContent className="pt-0">
              <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="time"
                      id="start-time"
                      value={doNotDisturb.startTime}
                      onChange={(e) => setDoNotDisturb({ ...doNotDisturb, startTime: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white p-2"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="time"
                      id="end-time"
                      value={doNotDisturb.endTime}
                      onChange={(e) => setDoNotDisturb({ ...doNotDisturb, endTime: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white p-2"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Notifications will be silenced during these hours
              </p>
            </CardContent>
          )}
        </Card>

        {/* Notification Categories */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notification Preferences</h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => toggleAll('all', true)}
                className="text-xs"
              >
                Enable All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => toggleAll('all', false)}
                className="text-xs"
              >
                Disable All
              </Button>
            </div>
          </div>

          {categories.map((category) => {
            const count = getCategoryCount(category.id);
            const enabledCount = getEnabledCount(category.id);
            const allEnabled = enabledCount === count;
            
            return (
              <Card key={category.id} className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{category.label}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {enabledCount} of {count} enabled
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={allEnabled}
                    onCheckedChange={(checked) => toggleAll(category.id as any, checked)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {preferences
                    .filter(pref => pref.category === category.id)
                    .map((preference) => (
                      <div key={preference.id} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="mt-0.5">
                            {preference.icon}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {preference.label}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {preference.description}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          checked={preference.enabled}
                          onCheckedChange={() => togglePreference(preference.id)}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </div>
                    ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button className="bg-amber-500 hover:bg-amber-600 text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
