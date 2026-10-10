"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function ProcessingPaymentPage() {
  const router = useRouter();
  const { items, timeSlot, clearCart } = useCartStore();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [message, setMessage] = useState("Creating your cash order...");
  const [done, setDone] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !items.length || attempted.current) return;
    attempted.current = true;

    const createOrder = async () => {
      const idempotencyKey = localStorage.getItem("qwikbite-order-idempotency-key") || crypto.randomUUID();
      localStorage.setItem("qwikbite-order-idempotency-key", idempotencyKey);
      try {
        setMessage("Validating menu prices and availability...");
        const pickupDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
        const response = await fetch("/api/orders/customer", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
          body: JSON.stringify({
            items: items.map((item: any) => ({ id: item.item.id, quantity: item.quantity })),
            timeSlot: timeSlot || "ASAP",
            pickupDate,
            paymentMethod: "cod",
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Unable to create order");
        const order = payload.data || payload.order || payload;
        if (!order.orderId) throw new Error("Server did not return an order ID");
        localStorage.setItem("lastOrderId", order.orderId);
        localStorage.setItem("orderId", order.orderId);
        localStorage.removeItem("orderData");
        localStorage.removeItem("qwikbite-order-idempotency-key");
        clearCart();
        setMessage("Order accepted. Opening confirmation...");
        setDone(true);
        setTimeout(() => router.replace("/customer/payment/success"), 400);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create order");
        router.replace("/customer/payment");
      }
    };
    createOrder();
  }, [authLoading, isAuthenticated, items, timeSlot, clearCart, router]);

  if (authLoading || !isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f8f6f5]"><Loader2 className="h-9 w-9 animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f6f5] p-6">
      <div className="w-full max-w-md rounded-3xl border border-[#e9d5ce] bg-white p-10 text-center shadow-xl">
        {done ? <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" /> : <Loader2 className="mx-auto h-16 w-16 animate-spin text-orange-500" />}
        <h1 className="mt-6 text-2xl font-black text-[#1c110d]">{done ? "Order Created" : "Securing Your Order"}</h1>
        <p className="mt-3 text-sm leading-6 text-[#6e5045]">{message}</p>
        <div className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-4 text-left">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <p className="text-sm text-green-900">Capacity and pricing are checked on the server. This screen never fabricates payment or order success.</p>
          </div>
        </div>
      </div>
    </div>
  );
}