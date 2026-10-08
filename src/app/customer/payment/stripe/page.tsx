"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

type StoredOrderData = {
  items: Array<{
    id: string | number;
    name: string;
    quantity: number;
    price?: number;
  }>;
  total?: number;
  timeSlot?: string;
  pickupDate?: string;
};

function StripePaymentForm({
  clientSecret,
  orderId,
  paymentIntentId,
  orderData,
}: {
  clientSecret: string;
  orderId: string;
  paymentIntentId: string;
  orderData: StoredOrderData;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error("Payment system is still loading.");
      return;
    }

    setLoading(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        toast.error(result.error.message || "Payment failed.");
        return;
      }

      const paymentIntent = result.paymentIntent;

      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        toast.error(
          "Payment needs additional action. Complete the payment and try again.",
        );
        return;
      }

      const confirmationResponse = await fetch("/api/payments/confirm", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          paymentIntentId: paymentIntent.id,
        }),
      });

      const confirmation = await confirmationResponse.json().catch(() => ({}));

      if (!confirmationResponse.ok) {
        throw new Error(
          confirmation.error || "Server-side payment verification failed.",
        );
      }

      localStorage.setItem("orderId", orderId);
      localStorage.setItem("lastOrderId", orderId);
      localStorage.removeItem("orderData");
      localStorage.removeItem("qwikbite-payment-idempotency-key");

      toast.success("Payment verified and order confirmed.");
      router.push("/customer/payment/success");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Payment verification failed. Please check your orders.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <PaymentElement />
      </div>

      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
          <div className="text-sm text-green-900">
            <p className="font-semibold">Payment verified server-side</p>
            <p className="mt-1">
              The amount, currency, order ownership, and Stripe payment status
              are checked again before the order becomes paid.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Order</h3>
        <div className="mt-4 space-y-3">
          {orderData.items.map((item) => (
            <div key={String(item.id)} className="flex justify-between gap-4 text-sm">
              <span className="text-gray-700">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium text-gray-900">
                ₹{((item.price || 0) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t pt-4 flex items-center justify-between">
          <span className="font-semibold text-gray-900">Estimated total</span>
          <span className="text-xl font-bold text-amber-600">
            ₹{Number(orderData.total || 0).toFixed(2)}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Final total is calculated from the current database menu prices.
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="submit"
        disabled={!stripe || !elements || loading}
        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Verifying payment...
          </>
        ) : (
          "Pay securely"
        )}
      </motion.button>
    </form>
  );
}

export default function StripePaymentPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<StoredOrderData | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [serverOrderId, setServerOrderId] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const stored = localStorage.getItem("orderData");

      if (!stored) {
        router.replace("/customer/order-summary");
        return;
      }

      let parsed: StoredOrderData;
      try {
        parsed = JSON.parse(stored);
      } catch {
        toast.error("Invalid order data.");
        router.replace("/customer/order-summary");
        return;
      }

      setOrderData(parsed);

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
          body: JSON.stringify({
            items: parsed.items,
            timeSlot: parsed.timeSlot,
            pickupDate: parsed.pickupDate,
            idempotencyKey,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to initialize payment.");
        }

        const payload = data.data || data;

        if (
          !payload.clientSecret ||
          !payload.orderId ||
          !payload.paymentIntentId
        ) {
          throw new Error("Payment session was not initialized correctly.");
        }

        if (!cancelled) {
          setClientSecret(payload.clientSecret);
          setServerOrderId(payload.orderId);
          setPaymentIntentId(payload.paymentIntentId);
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to initialize payment.",
        );
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </button>
          <h1 className="ml-4 text-2xl font-bold text-gray-900 dark:text-white">
            Secure Online Payment
          </h1>
        </div>

        {initializing || !orderData ? (
          <div className="rounded-2xl border bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-amber-500" />
            <p className="font-medium text-gray-900 dark:text-white">
              Preparing your secure payment
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              QwikBite is validating the cart and reserving your pickup capacity.
            </p>
          </div>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
              },
            }}
          >
            <StripePaymentForm
              clientSecret={clientSecret}
              orderId={serverOrderId}
              paymentIntentId={paymentIntentId}
              orderData={orderData}
            />
          </Elements>
        ) : (
          <div className="rounded-2xl border bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="font-medium text-gray-900 dark:text-white">
              Payment could not be initialized
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Please return to checkout and try again.
            </p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-6 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white"
            >
              Return to checkout
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          Powered by Stripe. Card details are collected by Stripe Elements and
          are not stored by QwikBite.
        </p>
      </div>
    </div>
  );
}
