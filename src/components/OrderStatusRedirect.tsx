'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderStatusRedirect() {
  const router = useRouter();

  useEffect(() => {
    // First try to get the latest order
    const fetchLatestOrder = async () => {
      try {
        console.log('Fetching latest order...');
        const response = await fetch('/customer/api/orders/latest', {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Latest order data:', data);
          
          if (data && data.order) {
            // If we have an order, redirect to its status page
            console.log('Found order, redirecting to:', `/customer/order-status/${data.order.id}`);
            router.push(`/customer/order-status/${data.order.id}`);
            return;
          }
        }
        
        // If we get here, there's no active order
        console.log('No active order found, redirecting to /customer/order-status/NoActive');
        router.push('/customer/order-status/NoActive');
      } catch (error) {
        console.error('Error fetching latest order:', error);
        // If there's an error, still redirect to the NoActive page
        router.push('/customer/order-status/NoActive');
      }
    };

    fetchLatestOrder();
  }, [router]);

  // Just show a loading state while we're checking for orders
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto"></div>
        <p className="text-gray-700 dark:text-gray-300">Loading your order status...</p>
      </div>
    </div>
  );
}