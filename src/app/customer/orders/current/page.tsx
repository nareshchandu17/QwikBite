'use client';

import { useEffect, useState } from 'react';
import NoActiveOrders from '@/components/orders/NoActiveOrders';
import OrderStatus from '@/components/orders/OrderStatus';

export default function CurrentOrderPage() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call to fetch active order
    const fetchActiveOrder = async () => {
      try {
        // Example API call - replace with your actual API endpoint
        // const response = await fetch('/api/orders/active');
        // const data = await response.json();
        // setActiveOrder(data);
        
        // For now, we'll simulate no active orders
        setActiveOrder(null);
      } catch (error) {
        console.error('Error fetching active order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrder();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // If there's no active order, show the NoActiveOrders component
  if (!activeOrder) {
    return <NoActiveOrders />;
  }

  // If there is an active order, show the OrderStatus component
  return <OrderStatus order={activeOrder} />;
}
