"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, CheckCheck, Clock, Package, CreditCard, MessageSquare, Tag, AlertCircle, X, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePusher } from "@/context/PusherContext";
import { useSession } from "next-auth/react";

type NotificationType = "order" | "offer" | "feedback" | "payment" | "system" | "alert" | "menu";
interface CustomerNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: "low" | "normal" | "high";
  icon?: string;
  data?: unknown;
  ctaLink?: string;
  isRead: boolean;
  timestamp: Date;
}

function normalizeNotification(raw: any, fallbackUserId: string): CustomerNotification | null {
  const id = String(raw?.id || raw?._id || "");
  if (!id) return null;
  const rawType = String(raw.type || "system");
  const type = (rawType === "order_update" ? "order" : rawType === "promotion" ? "offer" : rawType === "admin" ? "feedback" : rawType) as NotificationType;
  return {
    id,
    userId: String(raw.userId || raw.user || fallbackUserId),
    title: String(raw.title || "Notification"),
    message: String(raw.message || ""),
    type,
    priority: raw.priority === "high" || raw.priority === "low" ? raw.priority : "normal",
    icon: raw.icon,
    data: raw.data || raw.metadata,
    ctaLink: raw.ctaLink || raw.deepLink,
    isRead: Boolean(raw.isRead),
    timestamp: new Date(raw.timestamp || raw.createdAt || Date.now()),
  };
}

export default function CustomerNotifications() {
  const { data: session, status: sessionStatus } = useSession();
  const { pusherClient, isConnected } = usePusher();
  const userId = session?.user?.id || null;
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const seenIds = useRef(new Set<string>());
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const unreadCount = unreadTotal;

  const fetchNotifications = useCallback(async (showLoader = true) => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    if (showLoader) setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=50", {
        credentials: "include", cache: "no-store",
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Sign in to view notifications" : "Unable to load notifications");
      const payload = await response.json();
      const rows = Array.isArray(payload.data) ? payload.data : [];
      const normalized = rows.map((row: any) => normalizeNotification(row, userId)).filter(Boolean).slice(0, 50) as CustomerNotification[];
      normalized.forEach((item) => seenIds.current.add(item.id));
      setNotifications(normalized);
      setUnreadTotal(Number(payload.pagination?.unreadCount ?? normalized.filter((item) => !item.isRead).length));
    } catch (error) {
      if (showLoader) toast.error(error instanceof Error ? error.message : "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (sessionStatus !== "loading") void fetchNotifications();
  }, [sessionStatus, fetchNotifications]);

  // Reconcile persisted history on reconnect. Realtime events are low latency; MongoDB is the source of truth.
  useEffect(() => {
    if (isConnected && userId) void fetchNotifications(false);
  }, [isConnected, userId, fetchNotifications]);

  useEffect(() => {
    if (!pusherClient || !isConnected || !userId) return;
    const channelName = `private-user-${userId}`;
    const channel = pusherClient.subscribe(channelName);

    const onNew = (raw: any) => {
      const notification = normalizeNotification(raw, userId);
      if (!notification) return;
      if (seenIds.current.has(notification.id)) return;
      seenIds.current.add(notification.id);
      setNotifications((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)].slice(0, 50));
      if (!notification.isRead) setUnreadTotal((count) => count + 1);
      toast.info(notification.title, { description: notification.message });
    };
    const onUpdated = (event: { notificationId: string; isRead: boolean; unreadCount?: number }) => {
      setNotifications((prev) => prev.map((item) => item.id === event.notificationId ? { ...item, isRead: event.isRead } : item));
      if (typeof event.unreadCount === "number") setUnreadTotal(event.unreadCount);
      else void fetchNotifications(false);
    };
    const onDeleted = (event: { notificationId: string; unreadCount?: number }) => {
      setNotifications((prev) => prev.filter((item) => item.id !== event.notificationId));
      if (typeof event.unreadCount === "number") setUnreadTotal(event.unreadCount);
      else void fetchNotifications(false);
    };
    const onAllRead = () => { setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true }))); setUnreadTotal(0); };

    channel.bind("new_notification", onNew);
    channel.bind("notification_updated", onUpdated);
    channel.bind("notification_deleted", onDeleted);
    channel.bind("notifications_all_read", onAllRead);
    return () => {
      channel.unbind("new_notification", onNew);
      channel.unbind("notification_updated", onUpdated);
      channel.unbind("notification_deleted", onDeleted);
      channel.unbind("notifications_all_read", onAllRead);
      pusherClient.unsubscribe(channelName);
    };
  }, [pusherClient, isConnected, userId, fetchNotifications]);

  const markAsRead = async (notification: CustomerNotification) => {
    if (notification.isRead || busyId) return;
    setBusyId(notification.id);
    try {
      const response = await fetch(`/api/notifications?id=${encodeURIComponent(notification.id)}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isRead: true }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not mark notification as read");
      setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
      if (typeof payload.unreadCount === "number") setUnreadTotal(payload.unreadCount);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update notification");
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const response = await fetch("/api/notifications/mark-all-read", { method: "POST", credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not mark notifications as read");
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadTotal(Number(payload.unreadCount ?? 0));
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update notifications");
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (notification: CustomerNotification) => {
    setBusyId(notification.id);
    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(notification.id)}`, {
        method: "DELETE", credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete notification");
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
      if (typeof payload.unreadCount === "number") setUnreadTotal(payload.unreadCount);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete notification");
    } finally {
      setBusyId(null);
    }
  };

  const openNotification = async (notification: CustomerNotification) => {
    if (!notification.isRead) await markAsRead(notification);
    if (notification.ctaLink) window.location.assign(notification.ctaLink);
    else if (notification.type === "order") window.location.assign("/customer/order/status");
    else window.location.assign("/customer/notifications");
  };

  const iconFor = (type: string) => {
    const cls = "h-4 w-4";
    if (type === "order") return <Package className={cls} />;
    if (type === "payment") return <CreditCard className={cls} />;
    if (type === "feedback") return <MessageSquare className={cls} />;
    if (type === "offer" || type === "menu") return <Tag className={cls} />;
    if (type === "alert") return <AlertCircle className={cls} />;
    return <Bell className={cls} />;
  };

  if (sessionStatus === "loading" || !userId) return null;

  return (
    <div className="fixed right-4 top-[5.25rem] z-[60]">
      <button
        type="button"
        onClick={() => setShowPanel((open) => !open)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={showPanel}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-950/90 text-white shadow-lg shadow-black/20 backdrop-blur transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-950">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-slate-950 ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
      </button>

      <AnimatePresence>
        {showPanel && (
          <>
            <button aria-label="Close notifications overlay" onClick={() => setShowPanel(false)} className="fixed inset-0 -z-10 cursor-default" />
            <motion.section
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="absolute right-0 mt-3 flex max-h-[min(70vh,34rem)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-black/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-semibold">Notifications</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread · {isConnected ? "Live updates on" : "Reconnecting"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={markAllRead} disabled={!unreadCount || markingAll} className="rounded-lg px-2 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-40 dark:text-amber-300 dark:hover:bg-slate-800">
                    {markingAll ? "Saving…" : "Mark all read"}
                  </button>
                  <button type="button" aria-label="Close notifications" onClick={() => setShowPanel(false)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
                </div>
              </header>

              <div className="overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading history…</div>
                ) : notifications.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-900"><Bell className="h-5 w-5" /></span>
                    <p className="mt-3 text-sm font-medium">You’re all caught up</p>
                    <p className="mt-1 text-xs text-slate-500">New order and account updates will appear here.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.slice(0, 50).map((notification) => (
                      <li key={notification.id} className={`group relative px-3 py-3 transition ${notification.isRead ? "" : "bg-amber-50/70 dark:bg-amber-500/5"}`}>
                        <div className="flex gap-3">
                          <button type="button" onClick={() => void openNotification(notification)} className="flex min-w-0 flex-1 gap-3 text-left">
                            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notification.isRead ? "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300" : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"}`}>{iconFor(notification.type)}</span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start gap-2">
                                <span className="truncate text-sm font-semibold">{notification.title}</span>
                                {!notification.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />}
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">{notification.message}</span>
                              <span className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500"><Clock className="h-3 w-3" />{notification.timestamp.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                            </span>
                          </button>
                          <div className="flex shrink-0 flex-col gap-1">
                            {!notification.isRead && <button type="button" aria-label="Mark as read" title="Mark as read" onClick={() => void markAsRead(notification)} disabled={busyId === notification.id} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800"><Check className="h-4 w-4" /></button>}
                            <button type="button" aria-label="Delete notification" title="Delete notification" onClick={() => void deleteNotification(notification)} disabled={busyId === notification.id} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                <span className="text-[11px] text-slate-500">{isConnected ? "Connected for instant updates" : "Saved history stays available"}</span>
                <button type="button" onClick={() => { setShowPanel(false); window.location.assign("/customer/notifications"); }} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-300">View all <ExternalLink className="h-3 w-3" /></button>
              </footer>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
