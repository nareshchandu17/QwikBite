'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useWebSocket as useSocket } from './WebSocketContext';
import { menuItems } from '@/data/menu';

// Helper function to get real item image from menu
const getRealItemImage = (order: unknown) => {
  const o = order as { itemsArray?: Array<{ imageUrl?: string; image?: string; name: string }>; items?: string; imageUrl?: string };
  // Try to get image from order items first
  if (o.itemsArray && o.itemsArray.length > 0) {
    const firstItem = o.itemsArray[0];
    if (firstItem.imageUrl || firstItem.image) {
      return firstItem.imageUrl || firstItem.image;
    }
    
    // Try to find matching menu item
    const menuItem = menuItems.find((item) => 
      item.name.toLowerCase() === firstItem.name.toLowerCase() ||
      firstItem.name.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(firstItem.name.toLowerCase())
    );
    if (menuItem?.image) {
      return menuItem.image;
    }
  }
  
  // Try to parse items string and find first item
  if (typeof o.items === 'string') {
    const itemNames = o.items.split(',').map((item: string) => item.trim());
    const firstItemName = itemNames[0];
    if (firstItemName) {
      // Extract quantity and name
      const match = firstItemName.match(/(\d+)x\s*(.+)/);
      const itemName = match ? match[2] : firstItemName;
      
      const menuItem = menuItems.find((item) => 
        item.name.toLowerCase() === itemName.toLowerCase() ||
        itemName.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(itemName.toLowerCase())
      );
      if (menuItem?.image) {
        return menuItem.image;
      }
    }
  }
  
  // Return existing imageUrl if available
  return o.imageUrl;
};

export type OrderStatus = 'Preparing' | 'Delivered' | 'Cancelled' | 'Received';

export interface Order {
  id: string;
  username: string;
  status: OrderStatus;
  statusText?: string;
  date: string;
  items: string;
  price: string;
  total: number;
  imageUrl: string;
  originalPrice?: string;
  progressStep?: number;
  timeSlot?: string;
  pickupDate?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: string;
}

interface RawOrder {
  id?: string;
  orderId?: string;
  username: string;
  status: string;
  statusText?: string;
  createdAt: string;
  items: Array<string | { quantity: number; name: string }> | string;
  price: string | number;
  total?: number;
  originalPrice?: string | number;
  progressStep?: number;
  timeSlot?: string;
  pickupDate?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'date' | 'statusText' | 'progressStep'> & { itemsArray?: unknown[]; timeSlot?: string; paymentMethod?: string }, authToken?: string) => Promise<string>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { socket } = useSocket();

  // Handle real-time updates from WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = ({ status, order }: { status: string; order: { id?: string; orderId?: string } }) => {
      console.log('Customer received real-time order update:', order.id || order.orderId, status);

      setOrders(prev => prev.map(o => {
        if (o.id === order.id || o.id === order.orderId) {
          return {
            ...o,
            status: (status.charAt(0).toUpperCase() + status.slice(1)) as OrderStatus,
            statusText: `${status.charAt(0).toUpperCase() + status.slice(1)} your order`,
            progressStep: status === 'preparing' ? 1 : status === 'ready' ? 2 : status === 'delivered' ? 3 : 0
          };
        }
        return o;
      }));
    };

    socket.on('order:update', handleOrderUpdate);

    // Join rooms for all current orders
    orders.forEach(order => {
      socket.emit('order:join', order.id);
    });

    return () => {
      socket.off('order:update', handleOrderUpdate);
    };
  }, [socket, orders.length, isInitialized]);

  // Fetch orders from database on initial load
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('[OrderContext] Fetching orders from database...');
        
        // Use the main /api/orders endpoint which uses NextAuth
        const response = await fetch('/api/orders', { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('[OrderContext] Orders API response status:', response.status);
        
        let data = null;
        
        if (response.ok) {
          const responseJson = await response.json();
          // The endpoint returns { success: true, data: { orders: [], pagination: {} } } structure
          // or sometimes just { success: true, data: [] }
          if (responseJson.data && Array.isArray(responseJson.data.orders)) {
            data = responseJson.data.orders;
          } else if (Array.isArray(responseJson.data)) {
            data = responseJson.data;
          } else {
            data = [];
          }
          
          console.log('[OrderContext] ✅ Orders fetched successfully:', Array.isArray(data) ? data.length : 0, 'orders');
          console.log('[OrderContext] Orders data:', data);
        } else {
          const errorText = await response.text();
          console.error('[OrderContext] ❌ Failed to fetch orders:', {
            status: response.status,
            error: errorText
          });
          setIsInitialized(true);
          return;
        }
        
        if (!data || data.length === 0) {
          console.log('[OrderContext] No orders found in database');
          setOrders([]);
          setIsInitialized(true);
          return;
        }
        
        // Format and set orders
        const formattedOrders = (data as RawOrder[]).map((order) => {
          console.log('[OrderContext] Processing order:', order);
          return {
            id: order.id || order.orderId || '',
            username: order.username,
            status: (order.status.charAt(0).toUpperCase() + order.status.slice(1)) as OrderStatus,
            statusText: order.statusText || '',
            date: new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
            items: Array.isArray(order.items)
              ? order.items.map((item) =>
                typeof item === 'string' ? item : `${item.quantity}x ${item.name}`
              ).join(', ')
              : order.items,
            price: typeof order.price === 'number' ? `$${order.price.toFixed(2)}` : String(order.price || ''),
            total: typeof order.total === 'number' ? order.total : (typeof order.price === 'number' ? order.price : parseFloat(order.price?.replace('$', '') || '0')),
            imageUrl: getRealItemImage(order) || '/images/order.jpg',
            originalPrice: typeof order.originalPrice === 'number' 
              ? `$${order.originalPrice.toFixed(2)}` 
              : String(order.originalPrice || order.price || ''),
            progressStep: order.progressStep || 0,
            timeSlot: order.timeSlot,
            pickupDate: order.pickupDate,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt
          };
        });

        console.log('[OrderContext] Formatted orders:', formattedOrders);
        setOrders(formattedOrders);
        
      } catch (error) {
        console.error('[OrderContext] ❌ Error fetching orders:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    fetchOrders();
  }, []);

  // Save to localStorage whenever orders change
  useEffect(() => {
    if (isInitialized) {
      // Removed localStorage saving as requested
    }
  }, [orders, isInitialized]);

  const addOrder = async (order: Omit<Order, 'id' | 'date' | 'statusText' | 'progressStep'> & { itemsArray?: unknown[]; timeSlot?: string; paymentMethod?: string }, authToken?: string) => {
    console.log('[OrderContext] addOrder called with token:', authToken ? `${authToken.substring(0, 20)}...` : 'No token');
    
    // Generate truly unique ID: timestamp + random + nano-precision
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const uniqueId = `ORD-${timestamp}-${random}`;

    // Parse price to number for DB
    const numericPrice = parseFloat(order.price.replace(/[^0-9.]/g, '')) || 0;
    const numericOriginalPrice = order.originalPrice ? parseFloat(order.originalPrice.replace(/[^0-9.]/g, '')) : numericPrice;

    const newOrder: Order = {
      ...order,
      id: uniqueId,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      status: 'Preparing',
      statusText: 'Preparing your order',
      progressStep: 0,
      total: order.total || numericPrice,
    };

    console.log('[OrderContext] Attempting to save order to database:', {
      orderId: uniqueId,
      username: order.username,
      price: numericPrice,
      itemsCount: order.itemsArray?.length || 0
    });

    // Calculate pickupDate in IST
    const istOffset = 330; // minutes
    const now = new Date();
    const istTime = new Date(now.getTime() + (istOffset * 60000));
    const pickupDate = istTime.toISOString().split('T')[0];

    try {
      // Try customer orders API first (for authenticated users)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token is available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('[OrderContext] Authorization header added:', `Bearer ${authToken.substring(0, 20)}...`);
      } else {
        console.log('[OrderContext] No auth token available, request will be unauthenticated');
      }
      
      console.log('[OrderContext] Request headers:', headers);
      
      const response = await fetch('/api/orders/customer', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          id: uniqueId,
          orderId: uniqueId,
          userId: 'customer', // This should be the actual user ID from auth
          username: order.username,
          items: order.itemsArray || [], // Use itemsArray as items
          total: numericPrice,
          price: numericPrice,
          status: 'preparing',
          imageUrl: getRealItemImage(order) || '/images/order.jpg',
          originalPrice: numericOriginalPrice,
          statusText: 'Preparing your order',
          progressStep: 0,
          timeSlot: order.timeSlot || (window as unknown as { selectedTimeSlot?: string }).selectedTimeSlot || 'ASAP',
          pickupDate: pickupDate,
          paymentMethod: 'online',
          paymentStatus: 'completed'
        })
      });

      console.log('[OrderContext] Customer API response status:', response.status);
      
      if (response.ok) {
        const successData = await response.json().catch(() => ({}));
        console.log('[OrderContext] ✅ Order saved to database successfully:', successData);
        
        // ONLY add to local state AFTER successful database save
        setOrders(prev => {
          // Check if order with this ID already exists to prevent duplicates
          if (prev.some(o => o.id === uniqueId)) {
            console.warn('[OrderContext] Order with ID already exists:', uniqueId);
            return prev;
          }
          return [newOrder, ...prev];
        });

        // Simulate order progress (only for successfully saved orders)
        const progressInterval = setInterval(() => {
          setOrders(prev => {
            const updated = [...prev];
            const orderIndex = updated.findIndex(o => o.id === newOrder.id);

            if (orderIndex !== -1) {
              const currentStep = updated[orderIndex].progressStep || 0;

              if (currentStep < 3) {
                updated[orderIndex] = {
                  ...updated[orderIndex],
                  progressStep: currentStep + 1,
                };

                if (currentStep === 2) {
                  updated[orderIndex] = {
                    ...updated[orderIndex],
                    status: 'Delivered',
                    statusText: 'Delivered Successfully',
                  };
                  clearInterval(progressInterval);
                }
              }
            }

            return updated;
          });
        }, 30000); // Update every 30 seconds

      } else if (response.status === 401) {
        console.log('[OrderContext] ⚠️ Authentication required - order NOT saved');
        throw new Error('Authentication required');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[OrderContext] ❌ Failed to save order to database:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          details: errorData.details || errorData.error || 'Unknown error'
        });
        throw new Error(errorData.details || errorData.error || `Failed to save order to database: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error saving order to database:', error);
      // Don&apos;t add to local state if database save failed
      throw error;
    }

    // Return the generated ID so caller can use it for transactions, etc.
    return uniqueId;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? {
            ...order,
            status,
            statusText:
              status === 'Cancelled' ? 'Order Cancelled' : order.statusText,
          }
          : order
      )
    );
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
