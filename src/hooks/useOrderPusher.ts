'use client';

import { useEffect, useState } from 'react';
import { usePusher } from '@/context/PusherContext';

export interface OrderUpdate {
  orderId: string;
  status: string;
  estimatedTime?: number;
  currentQueue?: number;
  message?: string;
  timestamp: number;
}

interface UseOrderPusherOptions {
  orderId?: string;
  onStatusChange?: (update: OrderUpdate) => void;
  onError?: (error: Error) => void;
}

export function useOrderPusher({
  orderId,
  onStatusChange,
  onError,
}: UseOrderPusherOptions) {
  const { pusherClient, isConnected } = usePusher();
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!pusherClient || !isConnected || !orderId) return;

    const channelName = `order-${orderId.replace(/:/g, '-')}`;
    setIsLoading(true);

    try {
      const channel = pusherClient.subscribe(channelName);
      console.log(`Joined Pusher order channel: ${channelName}`);

      const handleOrderUpdate = (update: OrderUpdate) => {
        console.log('Order status update via Pusher:', update);
        setOrderStatus(update.status);
        onStatusChange?.(update);
      };

      channel.bind('order:update', handleOrderUpdate);
      channel.bind('order_update', handleOrderUpdate);

      setIsLoading(false);

      return () => {
        channel.unbind('order:update', handleOrderUpdate);
        channel.unbind('order_update', handleOrderUpdate);
        pusherClient.unsubscribe(channelName);
        console.log(`Left Pusher order channel: ${channelName}`);
      };
    } catch (err) {
      console.error('Failed to subscribe to order channel:', err);
      if (err instanceof Error) {
        onError?.(err);
      }
      setIsLoading(false);
    }
  }, [pusherClient, isConnected, orderId, onError, onStatusChange]);

  return {
    orderStatus,
    isLoading,
    isConnected,
  };
}
