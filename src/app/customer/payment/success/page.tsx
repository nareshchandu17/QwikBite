"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Order = {
  orderId: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount: number;
  pickupDate?: string;
  timeSlot?: string;
  createdAt: string;
  items: Array<{
    menuItem?: string;
    id?: string;
    name: string;
    quantity: number;
    price: number;
  }>;
};

function displayPaymentMethod(method?: string) {
  const value = String(method || "").toLowerCase();
  if (value === "cod" || value === "cash") return "Cash on Delivery";
  if (value === "stripe" || value === "card") return "Online payment";
  return method || "Online";
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      const orderId =
        localStorage.getItem("lastOrderId") || localStorage.getItem("orderId");

      if (!orderId || orderId.startsWith("#")) {
        toast.error("No confirmed order was found.");
        router.replace("/customer/orders");
        return;
      }

      try {
        const response = await fetch(
          "/api/orders/" + encodeURIComponent(orderId),
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.order) {
          throw new Error(payload.error || "Unable to load your order.");
        }

        if (active) {
          setOrder(payload.order);
          setLoading(false);
          localStorage.removeItem("orderData");
          localStorage.removeItem("qwikbite-order-idempotency-key");
        }
      } catch (error) {
        if (!active) return;
        setLoading(false);
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load your confirmed order.",
        );
      }
    };

    loadOrder();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-amber-500" />
          <p className="font-medium text-gray-900">Loading confirmed order…</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Order confirmation unavailable
          </h1>
          <p className="mt-3 text-gray-600">
            Check your order history. The server remains the source of truth for
            payment and order status.
          </p>
          <button
            type="button"
            onClick={() => router.push("/customer/orders")}
            className="mt-6 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white"
          >
            View orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>

        <h1 className="mt-5 text-center text-3xl font-bold text-gray-900">
          Order Confirmed
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Your order was accepted by QwikBite.
        </p>

        <div className="mt-8 space-y-4">
          <div className="flex justify-between border-b pb-3 text-sm">
            <span className="text-gray-500">Order ID</span>
            <span className="font-semibold text-gray-900">{order.orderId}</span>
          </div>
          <div className="flex justify-between border-b pb-3 text-sm">
            <span className="text-gray-500">Payment</span>
            <span className="font-semibold text-gray-900">
              {displayPaymentMethod(order.paymentMethod)} ·{" "}
              {String(order.paymentStatus || "pending").toLowerCase()}
            </span>
          </div>
          <div className="flex justify-between border-b pb-3 text-sm">
            <span className="text-gray-500">Pickup</span>
            <span className="font-semibold text-gray-900">
              {order.timeSlot || "ASAP"}
              {order.pickupDate ? " · " + order.pickupDate : ""}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-amber-600">
              ₹{Number(order.totalAmount || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-7 border-t pt-6">
          <p className="mb-3 text-sm font-semibold text-gray-900">Items</p>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div
                key={item.id || item.menuItem || index}
                className="flex justify-between gap-4 text-sm text-gray-700"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push("/customer/orders/current")}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-600"
          >
            Track order
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push("/customer/menu")}
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Order again
          </button>
        </div>
      </div>
    </div>
  );
}
