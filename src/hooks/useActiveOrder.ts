import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

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
  status:
    "PENDING" | "PREPARING" | "READY_FOR_PICKUP" | "COMPLETED" | "CANCELLED";
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
      if (!isAuthenticated) {
        setIsLoading(false);
        setActiveOrder(null);
        return;
      }

      try {
        const response = await fetch("/api/orders/customer/recent", {
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();

          setActiveOrder(data.order || null);
        } else {
          const errorText = await response.text();

          setActiveOrder(null);
        }
      } catch (error) {
        setActiveOrder(null);
      } finally {
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
