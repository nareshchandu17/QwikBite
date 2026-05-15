/**
 * Customer WebSocket Hook for Real-Time Order Updates
 * 
 * This hook provides:
 * - Automatic room subscription based on order ID
 * - Real-time status updates
 * - Connection state management
 * - Auto-reconnection with backoff
 * - Event listeners for order status changes
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
// Import removed
import { useWebSocket as useSocket } from '@/context/WebSocketContext';

export interface OrderUpdate {
  orderId: string;
  status: string;
  estimatedTime?: number;
  currentQueue?: number;
  message?: string;
  timestamp: number;
}

interface UseOrderWebSocketOptions {
  orderId?: string;
  onStatusChange?: (update: OrderUpdate) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to subscribe to order updates via WebSocket.
 * Automatically joins room `order:{orderId}` when component mounts.
 */
export function useOrderWebSocket({
  orderId,
  onStatusChange,
  onError,
}: UseOrderWebSocketOptions) {
  const { socket, isConnected } = useSocket();
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const roomRef = useRef<string | null>(null);

  // Join order room on mount or when orderId changes
  useEffect(() => {
    if (!socket || !isConnected || !orderId) return;

    const room = `order:${orderId}`;
    setIsLoading(true);

    // Join the room
    socket.emit('join:room', room, (response: { ok: boolean; error?: string }) => {
      if (response.ok) {
        roomRef.current = room;
        console.log(`Joined order room: ${room}`);
      } else {
        const error = new Error(response.error || 'Failed to join room');
        console.error(error);
        onError?.(error);
      }
      setIsLoading(false);
    });

    return () => {
      // Leave room on unmount
      if (roomRef.current && socket) {
        socket.emit('leave:room', roomRef.current, () => {
          console.log(`Left order room: ${roomRef.current}`);
          roomRef.current = null;
        });
      }
    };
  }, [socket, isConnected, orderId, onError]);

  // Listen for order status updates
  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = (update: OrderUpdate) => {
      console.log('Order status update:', update);
      setOrderStatus(update.status);
      onStatusChange?.(update);
    };

    socket.on('order:status', handleOrderUpdate);

    return () => {
      socket.off('order:status', handleOrderUpdate);
    };
  }, [socket, onStatusChange]);

  return {
    orderStatus,
    isLoading,
    isConnected,
  };
}

/**
 * Hook to send pings to monitor connection health.
 * Useful for detecting dead connections early.
 */
export function useWebSocketPing(interval: number = 30000) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const timer = setInterval(() => {
      socket.emit('ping', {}, (response: { pong: boolean; ts: number }) => {
        if (response?.pong) {
          console.log('WebSocket ping OK');
        }
      });
    }, interval);

    return () => clearInterval(timer);
  }, [socket, isConnected, interval]);
}
