'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types/order';
import { websocketClient } from '@/lib/websocket';
import {
  ArrowLeft,
  Clock,
  MapPin,
  MessageSquare,
  CheckCircle,
  ChevronRight,
  Loader2,
  Package,
  CookingPot,
  Timer,
  Handshake,
  Truck
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useCustomerGuard } from '@/hooks/use-customer-guard';

interface OrderStatusClientProps {
  initialOrder: Order;
  orderId: string;
}

const statusMessages: Partial<Record<string, string>> = {
  received: 'Your order has been received by the canteen.',
  preparing: 'Our chefs are preparing your delicious meal.',
  almost_ready: 'Your meal is almost ready!',
  ready: 'Your order is ready for pickup at Counter #2.',
  collected: 'Order completed successfully. Enjoy your meal!',
  Delivered: 'Your order has been delivered successfully!',
  Pending: 'Your order is pending confirmation.',
  Ready: 'Your order is ready for pickup.',
  'Out for Delivery': 'Your order is out for delivery!',
};

const statusIcons: Partial<Record<string, React.ReactNode>> = {
  received: <Package className="w-5 h-5" />,
  preparing: <CookingPot className="w-5 h-5" />,
  almost_ready: <Timer className="w-5 h-5" />,
  ready: <Handshake className="w-5 h-5" />,
  collected: <CheckCircle className="w-5 h-5" />,
  Delivered: <CheckCircle className="w-5 h-5 text-green-500" />,
  Pending: <Clock className="w-5 h-5 text-yellow-500" />,
  Ready: <CheckCircle className="w-5 h-5 text-green-500" />,
  'Out for Delivery': <Truck className="w-5 h-5 text-blue-500" />,
};

const statusColors: Partial<Record<string, string>> = {
  received: 'bg-blue-500',
  Delivered: 'bg-green-500',
  Pending: 'bg-yellow-500',
  Ready: 'bg-green-400',
  'Out for Delivery': 'bg-blue-400',
  preparing: 'bg-amber-500',
  almost_ready: 'bg-orange-500',
  ready: 'bg-green-500',
  collected: 'bg-green-500',
};

export function OrderStatusClient({ initialOrder, orderId }: OrderStatusClientProps) {
  useCustomerGuard(); // Add this hook to protect the page

  const [order, setOrder] = useState<Order>(initialOrder);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  useEffect(() => {
    // Connect to WebSocket
    console.log('Connecting to WebSocket for order:', orderId);
    websocketClient.connect(orderId);

    // Handle WebSocket events
    const handleConnect = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
      toast.success('Connected to real-time updates');
    };

    const handleDisconnect = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
      toast.info('Disconnected from real-time updates');
    };

    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      toast.error('Connection error: ' + (error?.message || 'Failed to connect'));
    };

    const handleOrderUpdate = (data: any) => {
      console.log('Received order update:', data);
      if (data && data.orderId === orderId) {
        setOrder(prevOrder => ({
          ...prevOrder,
          status: data.status
        }));
        toast.info(data.message || `Order status updated to ${data.status}`);
      }
    };

    // Register event listeners
    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);
    websocketClient.on('error', handleError);
    websocketClient.on('order_update', handleOrderUpdate);

    // Cleanup
    return () => {
      websocketClient.off('connect', handleConnect);
      websocketClient.off('disconnect', handleDisconnect);
      websocketClient.off('error', handleError);
      websocketClient.off('order_update', handleOrderUpdate);
      websocketClient.disconnect();
    };
  }, [orderId]);

  // Safety check for order status
  const safeOrderStatus = order?.status || 'received';
  const statusKeys = Object.keys(statusMessages) as string[];
  const statusIndex = statusKeys.indexOf(safeOrderStatus);
  const progress = order ? ((statusIndex + 1) / statusKeys.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Connection Status Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Real-time Updates</span>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' :
                    connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                <span className="capitalize text-gray-900 dark:text-white">
                  {connectionStatus === 'connected' ? 'Connected' :
                    connectionStatus === 'connecting' ? 'Connecting...' :
                      connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-10">
            <Link
              href="/orders"
              className="inline-flex items-center text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Order Status</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your order&apos;s journey from kitchen to counter!
            </p>
          </div>

          {/* Progress Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8"
          >
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Order Progress</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2.5 bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="grid grid-cols-5 gap-2">
              {statusKeys.map((status, index) => (
                <div key={status} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${index <= statusIndex
                    ? (statusColors[status] || 'bg-blue-500') + ' text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}>
                    {statusIcons[status] || <Clock className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs text-center ${index <= statusIndex
                    ? 'text-gray-900 dark:text-white font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-center text-gray-900 dark:text-white font-medium">
                {statusMessages[safeOrderStatus] || 'Processing your order...'}
              </p>
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Order Summary
              </CardTitle>
            </div>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Order ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">#{order?.id || orderId}</span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700"></div>

                <div className="space-y-4">
                  {order?.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-xs text-gray-400 dark:text-gray-500">No Image</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700"></div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="text-gray-900 dark:text-white">$0.00</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span className="text-amber-600 dark:text-amber-400">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 pt-1">
                    <span>Payment Method</span>
                    <span>{order.paymentMethod || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/menu"
              className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl text-center flex-1 flex items-center justify-center gap-2"
            >
              <span>Order Another Meal</span>
              <ChevronRight className="w-5 h-5" />
            </Link>

            {order?.status === 'collected' ? (
              <Link
                href={`/feedback?orderId=${order?.id || orderId}`}
                className="px-6 py-4 bg-white text-amber-600 border border-amber-200 hover:bg-amber-50 dark:bg-gray-800 dark:border-amber-800 dark:hover:bg-gray-700 shadow-lg font-semibold rounded-xl transition-all text-center flex-1 flex items-center justify-center gap-2"
              >
                <span>Leave Feedback</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <button
                className="px-6 py-4 bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400 font-semibold rounded-xl transition-all text-center flex-1 flex items-center justify-center gap-2"
                disabled
              >
                <span>Feedback (Available after pickup)</span>
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
