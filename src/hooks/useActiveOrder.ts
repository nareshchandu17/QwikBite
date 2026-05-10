import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  menuItem: {
    name: string;
    price: number;
  };
}

export interface Order {
  id: string;
  status: 'PENDING' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export function useActiveOrder() {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchActiveOrder = async () => {
      console.log('useActiveOrder - fetchActiveOrder called, isAuthenticated:', isAuthenticated);
      
      if (!isAuthenticated) {
        console.log('useActiveOrder - User not authenticated, setting activeOrder to null');
        setIsLoading(false);
        setActiveOrder(null);
        return;
      }

      try {
        console.log('useActiveOrder - Fetching active order from /customer/api/orders/active');
        const response = await fetch('/customer/api/orders/active', {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('useActiveOrder - Received active order data:', data);
          setActiveOrder(data.activeOrder || null);
        } else {
          const errorText = await response.text();
          console.error('useActiveOrder - Failed to fetch active order:', response.status, errorText);
          setActiveOrder(null);
        }
      } catch (error) {
        console.error('useActiveOrder - Error fetching active order:', error);
        setActiveOrder(null);
      } finally {
        console.log('useActiveOrder - Finished loading, setting isLoading to false');
        setIsLoading(false);
      }
    };

    fetchActiveOrder();
    
    // Poll for order status updates every 30 seconds
    const interval = setInterval(fetchActiveOrder, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return { activeOrder, isLoading };
}
