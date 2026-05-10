/**
 * Admin WebSocket Hook for Real-Time Order Broadcasting
 * 
 * This hook provides admin capabilities to:
 * - Send real-time order status updates to customers
 * - Broadcast notifications
 * - Monitor connected users
 * - Emit targeted or room-based events
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

export interface AdminNotificationPayload {
  userId?: string; // If provided, sends to single user. Otherwise broadcasts to all.
  event?: string;
  data?: unknown;
}

export interface OrderStatusPayload {
  orderId: string;
  status: string;
  estimatedTime?: number;
  currentQueue?: number;
  message?: string;
}

/**
 * Hook to initialize admin namespace socket connection.
 * Must be used on admin pages only.
 */
export function useAdminSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const adminSocket = getSocket({ namespace: '/admin' });
    setSocket(adminSocket);

    const handleConnect = () => {
      console.log('Admin socket connected');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Admin socket disconnected');
      setIsConnected(false);
    };

    adminSocket.on('connect', handleConnect);
    adminSocket.on('disconnect', handleDisconnect);

    // Check current state
    if (adminSocket.connected) {
      setIsConnected(true);
    }

    return () => {
      adminSocket.off('connect', handleConnect);
      adminSocket.off('disconnect', handleDisconnect);
    };
  }, []);

  return { socket, isConnected };
}

/**
 * Hook to send notifications to customers via admin namespace.
 */
export function useAdminNotifications() {
  const { socket } = useAdminSocket();

  const sendNotification = useCallback(
    (payload: AdminNotificationPayload) => {
      if (!socket || !socket.connected) {
        console.error('Admin socket not connected');
        return Promise.reject(new Error('Socket not connected'));
      }

      return new Promise((resolve, reject) => {
        socket.emit('notify:customer', payload, (response: { ok: boolean; error?: string }) => {
          if (response?.ok) {
            console.log('Notification sent successfully');
            resolve(response);
          } else {
            const error = new Error(response?.error || 'Failed to send notification');
            console.error(error);
            reject(error);
          }
        });
      });
    },
    [socket]
  );

  const broadcastToAll = useCallback(
    (event: string, data: unknown) => {
      return sendNotification({ event, data });
    },
    [sendNotification]
  );

  const notifyUser = useCallback(
    (userId: string, event: string, data: unknown) => {
      return sendNotification({ userId, event, data });
    },
    [sendNotification]
  );

  return {
    sendNotification,
    broadcastToAll,
    notifyUser,
    isConnected: socket?.connected ?? false,
  };
}

/**
 * Hook to update order status for customers.
 * Emits to specific order room (e.g., `order:orderId123`).
 */
export function useOrderStatusBroadcast() {
  const { socket } = useAdminSocket();

  const broadcastOrderStatus = useCallback(
    (payload: OrderStatusPayload) => {
      if (!socket || !socket.connected) {
        console.error('Admin socket not connected');
        return Promise.reject(new Error('Socket not connected'));
      }

      const room = `order:${payload.orderId}`;
      return new Promise<void>((resolve, reject) => {
        try {
          // Emit to the room - only customers in that room will receive it
          // Emit to server - the server will broadcast to the room
          socket.emit('order:status', {
            ...payload,
            room,
            timestamp: Date.now(),
          });
          console.log(`Order status broadcast to room: ${room}`);
          resolve();
        } catch (err) {
          console.error('Failed to broadcast order status:', err);
          reject(err);
        }
      });
    },
    [socket]
  );

  return { broadcastOrderStatus, isConnected: socket?.connected ?? false };
}
