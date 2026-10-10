"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  X,
  Settings,
  ArrowLeft,
  Check,
  Trash2,
  Clock,
  ShoppingBag,
  Tag,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { usePusher } from "@/context/PusherContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
type NotificationType = "order" | "offer" | "feedback" | "system";

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: Date;
  ctaLink?: string;
  priority: "low" | "normal" | "high";
  icon: string;
  data?: unknown;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { pusherClient, isConnected } = usePusher();
  const { data: session } = useSession();
  const router = useRouter();

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);

      const res = await fetch("/api/notifications", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401) {
        }
        setIsLoading(false);
        return;
      }

      const data = await res.json();

      const list: Notification[] = Array.isArray(data.data)
        ? data.data.map((n: any) => ({
            id: n._id?.toString() || n.id || "",
            userId: n.userId?.toString() || n.user?.toString() || "",
            type: n.type || "system",
            title: n.title || "",
            message: n.message || "",
            isRead: !!n.isRead,
            timestamp: n.createdAt ? new Date(n.createdAt) : new Date(),
            ctaLink: n.ctaLink || n.deepLink,
            priority: n.priority || "normal",
            icon: n.icon || "",
            data: n.data || n.metadata,
          }))
        : [];

      setNotifications(list);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe using the authenticated session, even when the inbox is empty.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!pusherClient || !isConnected || !userId) return;

    const channelName = `private-user-${userId}`;
    const channel = pusherClient.subscribe(channelName);
    const handleNewNotification = (notification: any) => {
      const item: Notification = {
        id: String(notification.id || notification._id || ""),
        userId: String(notification.userId || userId),
        type: notification.type || "system",
        title: notification.title || "Notification",
        message: notification.message || "",
        isRead: Boolean(notification.isRead),
        timestamp: new Date(notification.timestamp || notification.createdAt || Date.now()),
        ctaLink: notification.ctaLink || notification.deepLink,
        priority: notification.priority || "normal",
        icon: notification.icon || "🔔",
        data: notification.data || notification.metadata,
      };
      if (!item.id) return;
      setNotifications((prev) => [item, ...prev.filter((n) => n.id !== item.id)].slice(0, 100));
      toast.info(item.title);
    };
    const handleNotificationUpdate = (data: { notificationId: string; isRead: boolean }) => {
      setNotifications((prev) => prev.map((n) => n.id === data.notificationId ? { ...n, isRead: data.isRead } : n));
    };
    const handleNotificationDeleted = (data: { notificationId: string }) => {
      setNotifications((prev) => prev.filter((n) => n.id !== data.notificationId));
    };
    const handleAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    channel.bind("new_notification", handleNewNotification);
    channel.bind("notification_updated", handleNotificationUpdate);
    channel.bind("notification_deleted", handleNotificationDeleted);
    channel.bind("notifications_all_read", handleAllRead);
    return () => {
      channel.unbind("new_notification", handleNewNotification);
      channel.unbind("notification_updated", handleNotificationUpdate);
      channel.unbind("notification_deleted", handleNotificationDeleted);
      channel.unbind("notifications_all_read", handleAllRead);
      pusherClient.unsubscribe(channelName);
    };
  }, [pusherClient, isConnected, session?.user?.id]);

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "orders") return notification.type === "order";
    if (activeTab === "offers") return notification.type === "offer";
    if (activeTab === "feedback")
      return notification.type === "feedback" || notification.type === "system";
    return true;
  });

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );

        // Pusher doesn't emit from client by default, handled via REST above
      }
    } catch (error) {
      toast.error("Failed to update notification");
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/notifications/mark-all-read",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");

        // Pusher doesn't emit from client by default, handled via REST above
      }
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success("Notification deleted");

        // Pusher doesn't emit from client by default, handled via REST above
      }
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  }, []);

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case "order":
        return "Order";
      case "offer":
        return "Offer";
      case "feedback":
        return "Feedback";
      case "system":
        return "System";
      default:
        return "";
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-5 w-5 text-amber-500" />;
      case "offer":
        return <Tag className="h-5 w-5 text-green-500" />;
      case "feedback":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "system":
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }

    return "Just now";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
                >
                  <div className="flex space-x-4">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Stay updated with your canteen activities
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Notification settings</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs
            defaultValue="all"
            className="w-full"
            onValueChange={(value) => setActiveTab(value)}
          >
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <TabsTrigger
                value="all"
                className="text-gray-600 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-amber-400 rounded-md transition-all cursor-pointer"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="text-gray-600 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-amber-400 rounded-md flex items-center space-x-1 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger
                value="offers"
                className="text-gray-600 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-amber-400 rounded-md flex items-center space-x-1 cursor-pointer"
              >
                <Tag className="h-4 w-4" />
                <span>Offers</span>
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="text-gray-600 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-amber-400 rounded-md flex items-center space-x-1 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Feedback</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                No notifications yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                We&apos;ll let you know when something new arrives
              </p>
              <Button
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                onClick={() => router.push("/customer/menu")}
              >
                View Menu
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700",
                    !notification.isRead && "ring-1 ring-amber-500/20",
                  )}
                >
                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                          {getTypeIcon(notification.type)}
                        </div>
                      </div>

                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className={cn(
                                "text-gray-400 hover:text-green-500 transition-colors",
                                notification.isRead && "text-green-500",
                              )}
                            >
                              {notification.isRead ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <div className="h-3 w-3 border-2 border-gray-300 rounded-full"></div>
                              )}
                            </button>
                          </div>
                        </div>

                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatTimeAgo(notification.timestamp)}</span>
                          <span className="mx-2">•</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            {getTypeLabel(notification.type)}
                          </span>
                        </div>

                        {notification.ctaLink && (
                          <div className="mt-3">
                            <a
                              href={notification.ctaLink}
                              className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 group"
                              onClick={() => markAsRead(notification.id)}
                            >
                              View details
                              <svg
                                className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
