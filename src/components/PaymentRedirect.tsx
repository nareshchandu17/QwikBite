"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface PaymentRedirectProps {
  orderId: string;
  amount: number;
  upiId?: string;
  items?: Array<{ id: string; name: string; quantity: number; price: number; image?: string }>;
  onPaymentComplete?: () => void;
}

export default function PaymentRedirect({
  orderId,
  amount,
}: PaymentRedirectProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
        <div>
          <h2 className="font-semibold">Secure payment required</h2>
          <p className="mt-2 text-sm leading-6">
            The legacy manual UPI confirmation flow has been retired. Online
            payments must go through the server-verified Stripe checkout so
            QwikBite can verify the order amount and payment before confirming
            the order.
          </p>
          <p className="mt-3 text-xs text-amber-800">
            Order: {orderId} · Amount: ₹{Number(amount || 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
