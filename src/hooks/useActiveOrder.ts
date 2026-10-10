import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePusher } from "@/context/PusherContext";

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
  items: Array<{ id: string; name: string; quantity: number; price: number; menuItem: { name: string; price: number } }>;
  createdAt: string;
  updatedAt: string;
}
type RawOrder = {
  _id?: string; id?: string; orderId?: string; status: string; total?: number;
  totalAmount?: number; createdAt: string; updatedAt: string; items: RawItem[];
};

function normalizeStatus(status: string): Order["status"] {
  switch (String(status).toLowerCase()) {
    case "confirmed": return "CONFIRMED";
    case "preparing": return "PREPARING";
    case "ready": case "ready_for_pickup": return "READY_FOR_PICKUP";
    case "completed": case "delivered": return "COMPLETED";
    case "cancelled": return "CANCELLED";
    default: return "PENDING";
  }
}
function formatOrder(raw: RawOrder): Order {
  return {
    id: String(raw.orderId || raw.id || raw._id),
    status: normalizeStatus(raw.status),
    total: Number(raw.total ?? raw.totalAmount ?? 0),
    items: (raw.items || []).map((item, index) => {
      const menu = typeof item.menuItem === "object" && item.menuItem ? item.menuItem : { name: item.name, price: item.price };
      return { id: String(item.id ?? item.menuItem ?? index), name: item.name, quantity: Number(item.quantity || 1), price: Number(item.price || 0), menuItem: { name: String(menu.name || item.name), price: Number(menu.price ?? item.price ?? 0) } };
    }),
    createdAt: raw.createdAt, updatedAt: raw.updatedAt,
  };
}

export function useActiveOrder() {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { pusherClient, isConnected } = usePusher();

  useEffect(() => {
    let active = true;
    const fetchActiveOrder = async () => {
      if (!isAuthenticated) {
        if (active) { setActiveOrder(null); setIsLoading(false); }
        return;
      }
      try {
        const response = await fetch("/api/orders/customer/recent", { credentials: "include", cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Unable to load order");
        const raw = payload.order as RawOrder | null;
        if (active) setActiveOrder(raw ? formatOrder(raw) : null);
      } catch {
        if (active) setActiveOrder(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchActiveOrder();
    return () => { active = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!pusherClient || !isConnected || !activeOrder?.id) return;
    const channelName = `private-order-${activeOrder.id.replace(/:/g, "-")}`;
    const channel = pusherClient.subscribe(channelName);
    const handleUpdate = (event: any) => {
      const raw = event?.order;
      if (!raw) return;
      const incomingId = String(raw.orderId || raw.id || raw._id || "");
      if (incomingId !== activeOrder.id) return;
      setActiveOrder(formatOrder({ ...raw, orderId: activeOrder.id }));
    };
    channel.bind("order:update", handleUpdate);
    return () => {
      channel.unbind("order:update", handleUpdate);
      pusherClient.unsubscribe(channelName);
    };
  }, [pusherClient, isConnected, activeOrder?.id]);

  return { activeOrder, isLoading, isConnected };
}
