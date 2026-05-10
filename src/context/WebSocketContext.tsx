'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { websocketClient } from '@/lib/websocket';
import { Transaction } from '@/types/payment';

interface WebSocketContextType {
  socket: Socket | null;
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Ref to track mount status for logging
  const isMounted = useRef(false);

  const connect = useCallback((namespace: string = '/customer') => {
    console.log('[REACT SOCKET] connect() called for namespace:', namespace);
    websocketClient.connect(namespace);
    setSocket(websocketClient.getSocket());
  }, []);

  const disconnect = useCallback(() => {
    console.log('[REACT SOCKET] disconnect() requested');
    websocketClient.disconnect();
    setSocket(null);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!isMounted.current) {
        console.log('[REACT MOUNT] WebSocketProvider mounted', Date.now());
        isMounted.current = true;
    }

    // Automatically connect to customer namespace on mount
    connect('/customer');

    const handleConnect = () => {
        console.log('[REACT SOCKET] isConnected -> true');
        setIsConnected(true);
    };
    const handleDisconnect = () => {
        console.log('[REACT SOCKET] isConnected -> false');
        setIsConnected(false);
    };

    const unsubConnect = websocketClient.on('connect', handleConnect);
    const unsubDisconnect = websocketClient.on('disconnect', handleDisconnect);
    const unsubError = websocketClient.on('error', (err) => console.error('[REACT SOCKET ERROR]', err));

    // Sync initial state
    setIsConnected(websocketClient.isConnected);
    setSocket(websocketClient.getSocket());

    return () => {
      console.log('[REACT UNMOUNT] WebSocketProvider unmounting', Date.now());
      unsubConnect();
      unsubDisconnect();
      unsubError();
      // CRITICAL: We DO NOT call websocketClient.disconnect() here in Dev/Layout
      // because RootLayout unmounts frequently during HMR, and we want the socket 
      // to persist for a seamless experience. The singleton handles the cleanup.
    };
  }, [connect]);

  const sendFeedback = (feedback: any) => {
    const s = websocketClient.getSocket();
    if (s) {
        console.log('[REACT SOCKET] Sending feedback');
        s.emit('feedback:send', feedback);
    }
  };

  const updateFeedback = (id: string, updates: any) => {
    const s = websocketClient.getSocket();
    if (s) s.emit('feedback:update', { id, updates });
  };

  const sendNotification = (notification: any) => {
    const s = websocketClient.getSocket();
    if (s) s.emit('notification:send', notification);
  };

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'date'>) => {
    const s = websocketClient.getSocket();
    if (s) s.emit('create_transaction', transaction);
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    const s = websocketClient.getSocket();
    if (s) s.emit('update_transaction', { id, ...updates });
  }, []);

  return (
    <WebSocketContext.Provider value={{
      socket,
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
