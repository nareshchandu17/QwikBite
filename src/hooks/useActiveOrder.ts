import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface RawItem {
  id?: string | number;
  menuItem?: string | { name?: string; price?: number };
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY_FOR_PICKUP" | "COMPLETED" | "CANCELLED";
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    menuItem: { name: string; price: number };
  }>;
  createdAt: string;
  updatedAt: string;
}

function normalizeStatus(status: string): Order["status"] {
  switch (String(status).toLowerCase()) {
    case "confirmed": return "CONFIRMED";
    case "preparing": return "PREPARING";
    case "ready": return "READY_FOR_PICKUP";
    case "completed": return "COMPLETED";
    case "cancelled": return "CANCELLED";
    default: return "PENDING";
  }
}

export function useActiveOrder() {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let active = true;

    const fetchActiveOrder = async () => {
      if (!isAuthenticated) {
        if (active) {
          setActiveOrder(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/orders/customer/recent", {
          credentials: "include",
          cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Unable to load order");

        const raw = payload.order as (RawItem & { status:string; orderId?:string; total?:number; totalAmount?:number; createdAt:string; updatedAt:string; items:RawItem[] }) | null;
        if (active) {
          if (!raw) {
            setActiveOrder(null);
          } else {
            setActiveOrder({
              id: raw.orderId || String(raw.id),
              status: normalizeStatus(raw.status),
              total: Number(raw.total ?? raw.totalAmount ?? 0),
              items: raw.items.map((item, index) => {
                const menu =
                  typeof item.menuItem === "object" && item.menuItem
                    ? item.menuItem
                    : { name: item.name, price: item.price };
                return {
                  id: String(item.id ?? item.menuItem ?? index),
                  name: item.name,
                  quantity: Number(item.quantity),
                  price: Number(item.price),
                  menuItem: {
                    name: String(menu.name || item.name),
                    price: Number(menu.price ?? item.price),
                  },
                };
              }),
              createdAt: raw.createdAt,
              updatedAt: raw.updatedAt,
            });
          }
        }
      } catch {
        if (active) setActiveOrder(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchActiveOrder();
    const interval = setInterval(fetchActiveOrder, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  return { activeOrder, isLoading };
}
