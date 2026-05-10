'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/notifications';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function NotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if notifications are supported and permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const subscription = await requestNotificationPermission();

      if (subscription) {
        // Send subscription to your server
        const response = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ subscription }),
        });

        if (response.ok) {
          setIsSubscribed(true);
        }
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify server about unsubscription
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          credentials: 'include',
        });

        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!('Notification' in window)) {
    return null; // Notifications not supported
  }

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
        disabled={isLoading}
        aria-label={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
        className={cn(
          'rounded-full',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isSubscribed ? (
          <Bell className="h-5 w-5 text-amber-500" />
        ) : (
          <BellOff className="h-5 w-5 text-gray-400" />
        )}
      </Button>
    </div>
  );
}
