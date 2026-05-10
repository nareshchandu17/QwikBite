'use client';

import { useEffect, useState } from 'react';
import OrderStatus from '@/components/orders/OrderStatus';
import NoActiveOrders from '@/components/orders/NoActiveOrders';
import { useActiveOrder, type Order } from '@/hooks/useActiveOrder';
import { Loader2 } from 'lucide-react';

export default function OrderStatusPage() {
  const { activeOrder, isLoading } = useActiveOrder();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (activeOrder) {
    return <OrderStatus order={activeOrder} />;
  }

  return <NoActiveOrders />;
}
