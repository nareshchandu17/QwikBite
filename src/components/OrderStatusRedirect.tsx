"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrderStatusRedirect() {
  const router = useRouter();

  useEffect(() => {
    // First try to get the latest order
    const fetchLatestOrder = async () => {
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

          if (data && data.order) {
            // If we have an order, redirect to its status page

            router.push(`/customer/order-status/${data.order.id}`);
            return;
          }
        }

        // If we get here, there's no active order

        router.push("/customer/order-status/NoActive");
      } catch (error) {
        // If there's an error, still redirect to the NoActive page
        router.push("/customer/order-status/NoActive");
      }
    };

    fetchLatestOrder();
  }, [router]);

  // Just show a loading state while we're checking for orders
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto"></div>
        <p className="text-gray-700 dark:text-gray-300">
          Loading your order status...
        </p>
      </div>
    </div>
  );
}
