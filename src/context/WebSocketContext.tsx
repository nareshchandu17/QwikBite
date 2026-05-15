'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { websocketClient } from '@/lib/websocket';
import { Transaction } from '@/types/payment';

// Provide a mock socket interface that matches what components expect
interface MockSocket {
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  disconnect: () => void;
}

interface WebSocketContextType {
  socket: MockSocket | null;
  isConnected: boolean;
  feedbacks: any[];
  transactions: Transaction[];
  notifications: any[];
  sendFeedback: (feedback: any) => void;
  updateFeedback: (id: string, updates: any) => void;
  sendNotification: (notification: any) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  connect: (namespace?: string) => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const isMounted = useRef(false);

  // We expose websocketClient directly as the mock socket
  const mockSocket: MockSocket = {
    emit: (event: string, ...args: any[]) => {
      // Mock callbacks for emit if provided
      const lastArg = args[args.length - 1];
      if (typeof lastArg === 'function') {
        const callback = lastArg;
        // Simulate successful response for typical join/ping events
        setTimeout(() => callback({ ok: true, pong: true }), 0);
      }
      websocketClient.emit(event, ...args);
    },
    on: (event: string, callback: any) => websocketClient.on(event, callback),
    off: (event: string, callback: any) => websocketClient.off(event, callback),
    disconnect: () => websocketClient.disconnect()
  };

  const connect = useCallback((namespace: string = '/customer') => {
    console.log('[REACT SOCKET] connect() called for namespace:', namespace);
    websocketClient.connect(namespace);
  }, []);

  const disconnect = useCallback(() => {
    console.log('[REACT SOCKET] disconnect() requested');
    websocketClient.disconnect();
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!isMounted.current) {
        console.log('[REACT MOUNT] WebSocketProvider mounted', Date.now());
        isMounted.current = true;
    }

    connect('/customer');

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const unsubConnect = websocketClient.on('connect', handleConnect);
    const unsubDisconnect = websocketClient.on('disconnect', handleDisconnect);
    const unsubError = websocketClient.on('error', (err) => console.error('[REACT SOCKET ERROR]', err));

    setIsConnected(websocketClient.isConnected);

    return () => {
      console.log('[REACT UNMOUNT] WebSocketProvider unmounting', Date.now());
      unsubConnect();
      unsubDisconnect();
      unsubError();
    };
  }, [connect]);

  // Frontend to Backend via Pusher isn't standard without custom endpoints.
  // We mock these to prevent errors, but they would need REST fallback in a real app.
  const sendFeedback = (feedback: any) => console.log('Feedback via socket disabled in Pusher mode', feedback);
  const updateFeedback = (id: string, updates: any) => console.log('Feedback update disabled', id);
  const sendNotification = (notification: any) => console.log('Notification disabled', notification);
  const addTransaction = useCallback((transaction: any) => console.log('Transaction disabled', transaction), []);
  const updateTransaction = useCallback((id: string, updates: any) => console.log('Transaction update disabled', id), []);

  return (
    <WebSocketContext.Provider value={{
      socket: mockSocket,
      isConnected,
      feedbacks,
      transactions,
      notifications,
      sendFeedback,
      updateFeedback,
      sendNotification,
      addTransaction,
      updateTransaction,
      connect,
      disconnect
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
