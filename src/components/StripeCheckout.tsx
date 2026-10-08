"use client";

import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import toast from "react-hot-toast";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE ||
    "",
);

function CheckoutForm({
  clientSecret,
  orderId,
  paymentIntentId,
}: {
  clientSecret: string;
  orderId: string;
  paymentIntentId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url:
            window.location.origin +
            "/customer/payment/success?orderId=" +
            encodeURIComponent(orderId),
        },
      });

      if (result.error) {
        toast.error(result.error.message || "Payment failed");
        return;
      }

      if (!result.paymentIntent || result.paymentIntent.status !== "succeeded") {
        toast.error("Payment is not complete yet. Please finish the required authentication.");
        return;
      }

      const confirmation = await fetch("/api/payments/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentIntentId: result.paymentIntent.id || paymentIntentId,
        }),
      });

      const payload = await confirmation.json().catch(() => ({}));

      if (!confirmation.ok) {
        throw new Error(payload.error || "Payment verification failed");
      }

      localStorage.setItem("lastOrderId", orderId);
      localStorage.setItem("orderId", orderId);
      toast.success("Payment verified successfully");
      window.location.href = "/customer/payment/success?orderId=" + encodeURIComponent(orderId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
}

export default function StripeCheckout({ orderId }: { orderId: string }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState("");

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const idempotencyKey =
          localStorage.getItem("qwikbite-payment-idempotency-key") ||
          crypto.randomUUID();

        localStorage.setItem(
          "qwikbite-payment-idempotency-key",
          idempotencyKey,
        );

        const response = await fetch("/api/payments/create-payment-intent", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({ orderId, idempotencyKey }),
        });

        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(json.error || "Unable to initialize payment");
        }

        const data = json.data || json;

        if (!data.clientSecret || !data.paymentIntentId) {
          throw new Error("Invalid payment initialization response");
        }

        if (mounted) {
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
        }
      } catch (error) {
        console.error("payment initialization failed", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to initialize payment",
        );
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [orderId]);

  if (!clientSecret) return <div>Initializing secure payment...</div>;

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: "stripe" } }}
    >
      <CheckoutForm
        clientSecret={clientSecret}
        orderId={orderId}
        paymentIntentId={paymentIntentId}
      />
    </Elements>
  );
}
