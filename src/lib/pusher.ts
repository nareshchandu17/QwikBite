import PusherServer from "pusher";
import PusherClient from "pusher-js";

// Backend Pusher instance (server only).
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
  useTLS: true,
});

let pusherClientInstance: PusherClient | null = null;

// Client instance is a singleton so views share one connection. Private-channel
// subscriptions must authenticate against our session/ownership-checking route.
export const getPusherClient = () => {
  if (typeof window === "undefined") return null;

  if (!pusherClientInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY || "";
    if (!key) return null;

    pusherClientInstance = new PusherClient(key, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
      forceTLS: true,
      authEndpoint: "/api/pusher/auth",
    });
  }

  return pusherClientInstance;
};

export function getOrderChannel(orderId: string) {
  return `private-order-${orderId.replace(/:/g, "-")}`;
}

export function getUserChannel(userId: string) {
  return `private-user-${userId}`;
}

export const ADMIN_CHANNEL = "private-admin";
