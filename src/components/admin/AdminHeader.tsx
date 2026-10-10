"use client";

import { useState } from "react";
import { NotificationIcon, ChevronDownIcon } from "./icons";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/lib/hooks/useNotifications";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  setActiveTab?: (tab: string) => void;
  activeTab?: string;
}

export default function AdminHeader({
  title,
  subtitle,
  setActiveTab,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications(user?.id || null, 1, 20);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const unread = notifications.filter((item: any) => !item.read);
  const markAllRead = async () => {
    await Promise.all(
      unread.map((item: any) =>
        fetch("/api/notifications?id=" + encodeURIComponent(String(item._id || item.id)), {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ read: true }),
        }).catch(() => undefined),
      ),
    );
    window.location.reload();
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    try {
      await logout();
    } catch {
      window.location.href = "/signin";
    }
  };

  return (
    <header className="relative z-50 flex flex-shrink-0 items-center justify-between p-4 pr-8">
      <div className="space-y-1">
        {title && <h1 className="text-2xl font-bold text-amber-700">{title}</h1>}
        {subtitle && <p className="text-sm text-amber-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen((open) => !open);
              setIsProfileOpen(false);
            }}
            className="relative rounded-full p-2 text-[#9ca3af] transition hover:bg-white/5 hover:text-white"
            aria-label="Notifications"
          >
            <NotificationIcon className="h-6 w-6" />
            {unread.length > 0 && (
              <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#F09819]" />
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-4 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(20,20,20,0.94)] shadow-2xl backdrop-blur-[24px]">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <h3 className="font-bold text-white">Notifications</h3>
                {unread.length > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-[#F09819] hover:text-white"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-500">
                    No notifications yet.
                  </p>
                ) : (
                  notifications.map((notification: any) => (
                    <button
                      type="button"
                      key={String(notification._id || notification.id)}
                      onClick={() => {
                        setIsNotifOpen(false);
                        if (notification.tab && setActiveTab) {
                          setActiveTab(notification.tab);
                        }
                      }}
                      className="block w-full border-b border-white/5 p-4 text-left transition hover:bg-white/5"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={
                            "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full " +
                            (notification.read
                              ? "bg-gray-600"
                              : "bg-[#F09819]")
                          }
                        />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {notification.title || "Notification"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-gray-400">
                            {notification.message || ""}
                          </p>
                          {notification.createdAt && (
                            <p className="mt-1 text-[10px] text-gray-600">
                              {new Date(notification.createdAt).toLocaleString("en-IN", {
                                timeZone: "Asia/Kolkata",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen((open) => !open);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-white transition hover:bg-white/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 font-bold text-slate-950">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold">{user?.name || "Admin"}</p>
              <p className="text-xs text-gray-500">
                {user?.role || "staff"}
              </p>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-white/10 bg-[rgba(20,20,20,0.96)] p-2 shadow-2xl">
              <div className="border-b border-white/10 px-3 py-3">
                <p className="text-sm font-semibold text-white">
                  {user?.name || "Admin"}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {user?.email || ""}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
