"use client";

import NoActiveOrders from "@/components/orders/NoActiveOrders";
import OrderStatus from "@/components/orders/OrderStatus";
import { useActiveOrder } from "@/hooks/useActiveOrder";

export default function CurrentOrderPage() {
  const { activeOrder, isLoading } = useActiveOrder();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-amber-500" />
      </div>
    );
  }

  return activeOrder ? <OrderStatus order={activeOrder} /> : <NoActiveOrders />;
}
