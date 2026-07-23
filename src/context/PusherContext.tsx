'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { getPusherClient } from '@/lib/pusher';
import { Transaction } from '@/types/payment';

interface PusherContextType {
  pusherClient: ReturnType<typeof getPusherClient>;
  isConnected: boolean;
  feedbacks: any[];
  transactions: Transaction[];
  notifications: any[];
  sendFeedback: (feedback: any) => void;
  updateFeedback: (id: string, updates: any) => void;
  sendNotification: (notification: any) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  connect: () => void;
  disconnect: () => void;
}

const PusherContext = createContext<PusherContextType | null>(null);

export function PusherProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const isMounted = useRef(false);
  const pusherClient = getPusherClient();

  const connect = useCallback(() => {
    if (!pusherClient) return;
    if (pusherClient.connection.state !== 'connected') {
      pusherClient.connect();
    }
  }, [pusherClient]);

  const disconnect = useCallback(() => {
    if (!pusherClient) return;
    pusherClient.disconnect();
    setIsConnected(false);
  }, [pusherClient]);

  useEffect(() => {
    if (!isMounted.current) {
        isMounted.current = true;
    }

    if (!pusherClient) return;

    connect();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err: any) => console.error('[PUSHER ERROR]', err);

    pusherClient.connection.bind('connected', handleConnect);
    pusherClient.connection.bind('disconnected', handleDisconnect);
    pusherClient.connection.bind('error', handleError);

    setIsConnected(pusherClient.connection.state === 'connected');

    // Subscribe to payment updates channel
    const paymentChannel = pusherClient.subscribe('admin');
    
    paymentChannel.bind('payment_update', (data: any) => {
      console.log('[PUSHER] Payment update received:', data);
      if (data.type === 'payment_created' || data.type === 'payment_updated') {
        const newTransaction = {
          id: data.payment._id,
          transactionId: data.payment.transactionId,
          orderId: data.payment.orderId,
          customer: data.payment.customerName,
          amount: data.payment.amount,
          method: data.payment.method,
          status: data.payment.status.charAt(0).toUpperCase() + data.payment.status.slice(1),
          date: data.payment.createdAt,
        };
        setTransactions(prev => [newTransaction, ...prev]);
      }
    });

    return () => {
      paymentChannel.unbind('payment_update');
      paymentChannel.unsubscribe();
      pusherClient.connection.unbind('connected', handleConnect);
      pusherClient.connection.unbind('disconnected', handleDisconnect);
      pusherClient.connection.unbind('error', handleError);
    };
  }, [connect, pusherClient]);

  const sendFeedback = (feedback: any) => console.log('Feedback via realtime disabled in Pusher mode', feedback);
  const updateFeedback = (id: string, updates: any) => console.log('Feedback update disabled', id);
  const sendNotification = (notification: any) => console.log('Notification disabled', notification);
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `temp-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  }, []);
  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(txn => 
      txn.id === id || txn.transactionId === id ? { ...txn, ...updates } : txn
    ));
  }, []);

  return (
    <PusherContext.Provider value={{
      pusherClient,
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
    </PusherContext.Provider>
  );
}

export const usePusher = () => {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error('usePusher must be used within a PusherProvider');
  }
  return context;
}
