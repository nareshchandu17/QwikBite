"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePusher } from "./PusherContext";

export type OrderStatus = "Preparing" | "Delivered" | "Cancelled" | "Received";

export interface Order {
  id: string;
  username: string;
  status: OrderStatus;
  statusText?: string;
  date: string;
  items: string | Array<{ quantity: number; name: string; imageUrl?: string; image?: string; id?: string | number; price?: number }>;
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
  updatedAt?: string;
}

interface RawOrderItem {
  quantity: number; name: string; image?: string; imageUrl?: string; id?: string | number; price?: number;
}
interface RawOrder {
  id?: string; orderId?: string; username?: string; status?: string; createdAt?: string; updatedAt?: string;
  items?: RawOrderItem[] | string; price?: number | string; total?: number; totalAmount?: number;
  timeSlot?: string; pickupDate?: string; paymentMethod?: string; paymentStatus?: string;
}

interface AddOrderInput extends Omit<Order, "id" | "date" | "statusText" | "progressStep"> {
  itemsArray: Array<{ id: string | number; name?: string; quantity: number; price?: number; image?: string; imageUrl?: string }>;
}
interface OrderContextType {
  orders: Order[];
  addOrder: (order: AddOrderInput, authToken?: string) => Promise<string>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

function normalizeStatus(status?: string): OrderStatus {
  switch (String(status || "").toLowerCase()) {
    case "preparing": return "Preparing";
    case "completed":
    case "delivered":
    case "ready": return "Delivered";
    case "cancelled": return "Cancelled";
    default: return "Received";
  }
}

function normalizeItems(items: RawOrder["items"]) {
  if (!Array.isArray(items)) return items || "";
  return items.map((item) => ({
    quantity: Number(item.quantity || 1),
    name: item.name,
    imageUrl: item.imageUrl || item.image,
    image: item.image,
    id: item.id,
    price: Number(item.price || 0),
  }));
}

function formatOrder(raw: RawOrder): Order | null {
  const id = raw.orderId || raw.id;
  if (!id) return null;
  const total = Number(raw.totalAmount ?? raw.total ?? (typeof raw.price === "number" ? raw.price : parseFloat(String(raw.price || "0").replace(/[^0-9.]/g, "")) || 0));
  const createdAt = raw.createdAt || new Date().toISOString();
  return {
    id: String(id),
    username: raw.username || "Customer",
    status: normalizeStatus(raw.status),
    statusText: raw.status || "Order received",
    date: new Date(createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Kolkata" }),
    items: normalizeItems(raw.items),
    price: "₹" + total.toFixed(2),
    total,
    imageUrl: Array.isArray(raw.items) ? (raw.items[0]?.imageUrl || raw.items[0]?.image || "/images/order.jpg") : "/images/order.jpg",
    originalPrice: "₹" + total.toFixed(2),
    progressStep: normalizeStatus(raw.status) === "Delivered" ? 3 : normalizeStatus(raw.status) === "Preparing" ? 1 : 0,
    timeSlot: raw.timeSlot,
    pickupDate: raw.pickupDate,
    paymentMethod: raw.paymentMethod,
    paymentStatus: raw.paymentStatus,
    createdAt,
    updatedAt: raw.updatedAt || createdAt,
  };
}

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { pusherClient } = usePusher();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/orders?limit=100", { credentials: "include", cache: "no-store" });
        if (!response.ok) return;
        const json = await response.json().catch(() => ({}));
        const data = Array.isArray(json?.data?.orders) ? json.data.orders : Array.isArray(json?.data) ? json.data : [];
        if (!active) return;
        setOrders(data.map(formatOrder).filter(Boolean) as Order[]);
      } finally {

      }
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!pusherClient) return;
    const handlers: Array<{ channel: string; handler: (data: any) => void }> = [];
    orders.forEach((order) => {
      const channel = "order-" + order.id.replace(/:/g, "-");
      const handler = (data: any) => {
        const updatedId = String(data?.order?.orderId || data?.order?.id || order.id);
        if (updatedId !== order.id) return;
        setOrders((prev) => prev.map((current) => current.id === order.id ? { ...current, ...formatOrder({ ...data.order, orderId: order.id }) } as Order : current));
      };
      const channelObject = pusherClient.subscribe(channel);
      channelObject.bind("order:update", handler);
      handlers.push({ channel, handler });
    });
    return () => {
      handlers.forEach(({ channel, handler }) => {
        const channelObject = pusherClient.channel(channel);
        if (channelObject) channelObject.unbind("order:update", handler);
        pusherClient.unsubscribe(channel);
      });
    };
  }, [pusherClient, orders]);

  const addOrder = useCallback(async (order: AddOrderInput, authToken?: string) => {
    if (!order.itemsArray?.length) throw new Error("Order must contain at least one item");
    const key = localStorage.getItem("qwikbite-order-idempotency-key") || crypto.randomUUID();
    localStorage.setItem("qwikbite-order-idempotency-key", key);
    const headers: Record<string, string> = { "Content-Type": "application/json", "Idempotency-Key": key };
    if (authToken) headers.Authorization = "Bearer " + authToken;
    const response = await fetch("/api/orders/customer", {
      method: "POST", credentials: "include", headers,
      body: JSON.stringify({
        items: order.itemsArray.map((item) => ({ id: item.id, quantity: item.quantity })),
        timeSlot: order.timeSlot || "ASAP",
        pickupDate: order.pickupDate,
        paymentMethod: String(order.paymentMethod || "cod").toLowerCase(),
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json?.error || "Failed to create order");
    const serverOrder = json?.data || json?.order || json;
    const formatted = formatOrder(serverOrder);
    if (!formatted) throw new Error("Server did not return a valid order");
    setOrders((prev) => [formatted, ...prev.filter((item) => item.id !== formatted.id)]);
    localStorage.setItem("lastOrderId", formatted.id);
    return formatted.id;
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((order) => order.id === orderId ? { ...order, status, statusText: status === "Cancelled" ? "Order Cancelled" : order.statusText } : order));
  }, []);

  const contextValue = useMemo(() => ({ orders, addOrder, updateOrderStatus }), [orders, addOrder, updateOrderStatus]);
  return <OrderContext.Provider value={contextValue}>{children}</OrderContext.Provider>;
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within an OrderProvider");
  return context;
};