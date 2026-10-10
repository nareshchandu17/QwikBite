"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CreditCard, Handshake, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type OrderData = { id?: string; items: Array<{ id: string | number; name: string; quantity: number; price: number }>; total: number; timeSlot?: string; pickupDate?: string };

const METHODS = [
  { id: "online", name: "Online Payment", description: "Card, UPI and other methods via Stripe", icon: CreditCard },
  { id: "cod", name: "Cash on Pickup", description: "Pay at the canteen counter when you collect", icon: Handshake },
] as const;

export default function PaymentPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [selected, setSelected] = useState<"online" | "cod">("online");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("orderData");
    if (!stored) {
      toast.error("No checkout data found.");
      router.replace("/customer/order-summary");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as OrderData;
      if (!Array.isArray(parsed.items) || parsed.items.length === 0) throw new Error("Cart is empty");
      setOrder(parsed);
    } catch {
      toast.error("Invalid checkout data.");
      router.replace("/customer/order-summary");
    }
  }, [router]);

  const handleContinue = () => {
    if (!order) return;
    setProcessing(true);
    localStorage.setItem("selectedPaymentMethod", selected);
    if (selected === "cod") router.push("/customer/payment/processing");
    else router.push("/customer/payment/stripe");
  };

  if (!order) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="min-h-screen bg-[#f8f6f5] px-[5%] py-12 text-[#1c110d]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-orange-500">Checkout</p>
          <h1 className="text-4xl font-black">Choose how you want to pay</h1>
          <p className="mt-2 text-[#9e6047]">Final pricing is calculated again on our server before an order is accepted.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="space-y-5">
            {METHODS.map((method) => {
              const Icon = method.icon;
              const active = selected === method.id;
              return (
                <button key={method.id} type="button" onClick={() => setSelected(method.id)}
                  className={["w-full rounded-2xl border bg-white p-6 text-left transition", active ? "border-orange-400 ring-2 ring-orange-100" : "border-[#e9d5ce] hover:border-orange-300"].join(" ")}
                >
                  <div className="flex items-center gap-4">
                    <div className={["flex h-12 w-12 items-center justify-center rounded-xl", active ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-500"].join(" ")}><Icon className="h-6 w-6" /></div>
                    <div className="flex-1">
                      <p className="text-lg font-bold">{method.name}</p>
                      <p className="mt-1 text-sm text-[#9e6047]">{method.description}</p>
                    </div>
                    <div className={["flex h-6 w-6 items-center justify-center rounded-full border-2", active ? "border-orange-500" : "border-gray-300"].join(" ")}>
                      {active && <div className="h-3 w-3 rounded-full bg-orange-500" />}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                <div className="text-sm text-green-900">
                  <p className="font-semibold">Protected checkout</p>
                  <p className="mt-1">QwikBite never trusts the browser for price, tax, stock availability, slot capacity, or payment success.</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-[#e9d5ce] bg-white p-6 shadow-sm lg:sticky lg:top-8">
            <h2 className="text-xl font-black">Order summary</h2>
            <div className="mt-5 space-y-3">
              {order.items.map((item) => (
                <div key={String(item.id)} className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-700">{item.name} × {item.quantity}</span>
                  <span className="font-semibold">₹{(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-[#e9d5ce] pt-5">
              <div className="flex justify-between text-sm text-[#9e6047]"><span>Displayed total</span><span>₹{Number(order.total || 0).toFixed(2)}</span></div>
              <p className="mt-2 text-xs text-gray-500">The server may reject this checkout if menu prices or availability changed.</p>
            </div>
            <button type="button" disabled={processing} onClick={handleContinue}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
              {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {processing ? "Opening secure checkout..." : selected === "cod" ? "Place cash order" : "Continue to secure payment"}
              {!processing && <ArrowRight className="h-5 w-5" />}
            </button>
            <button type="button" onClick={() => router.push("/customer/order-summary")} className="mt-3 w-full rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50">Back to order summary</button>
          </aside>
        </div>
      </div>
    </div>
  );
}