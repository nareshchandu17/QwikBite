"use client";

import React, { useEffect, useState, useCallback } from "react";
import KpiCard from "./KpiCard";
import LiveOrdersQueue from "./LiveOrdersQueue";
import { Order, OrderStatus } from "@/types/order";
import SlotLoadViz from "./SlotLoadViz";
import { Clock, Utensils, Clock3, TrendingUp, ChefHat, Zap } from "lucide-react";

interface DashboardOverviewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

type Analytics = {
  insights?: { totalOrders?: number; totalRevenue?: number; avgOrderValue?: string; busiestTime?: string; studentFavorites?: string; };
  peakHours?: Array<{ hour: string; orders: number }>
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ orders, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [slots, setSlots] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDashboardData = useCallback(async () => {
    const [slotResponse, analyticsResponse] = await Promise.all([
      fetch("/api/admin/timeslots/today", { credentials: "include", cache: "no-store" }),
      fetch("/api/admin/analytics?days=1", { credentials: "include", cache: "no-store" }),
    ]);
    if (slotResponse.ok) setSlots(await slotResponse.json());
    if (analyticsResponse.ok) setAnalytics(await analyticsResponse.json());
  }, []);

  useEffect(() => {
    fetchDashboardData().catch(() => undefined);
    const interval = setInterval(() => fetchDashboardData().catch(() => undefined), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => onUpdateStatus(orderId, status), [onUpdateStatus]);

  const activeOrders = orders.filter((order) => ["pending","confirmed","preparing","ready","received","almost_ready"].includes(String(order.status || "").toLowerCase()));
  const totalOrders = analytics?.insights?.totalOrders ?? orders.length;
  const revenue = analytics?.insights?.totalRevenue ?? 0;
  const avgOrderValue = analytics?.insights?.avgOrderValue || "₹0";
  const topDish = analytics?.insights?.studentFavorites || "No data";
  const peakHour = analytics?.insights?.busiestTime || "No data";
  const liveCapacity = slots.reduce((max, slot) => Math.max(max, Number(slot.percentage || 0)), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Canteen Operations</h1>
          <p className="text-gray-400">Live operational data from QwikBite.</p>
        </div>
        <div className="mt-4 flex items-center space-x-2 rounded-lg bg-gray-800/50 px-4 py-2 md:mt-0">
          <Clock3 className="h-5 w-5 text-amber-500" /><span className="font-medium text-white">{formatTime(currentTime)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Orders Today" value={String(totalOrders)} change="Live" icon={<Utensils className="h-5 w-5" />} onClick={() => setActiveTab("Orders")} />
        <KpiCard title="Paid Revenue Today" value={`₹${Number(revenue).toLocaleString("en-IN")}`} change="Verified" isCurrency icon={<TrendingUp className="h-5 w-5" />} onClick={() => setActiveTab("Payments")} />
        <KpiCard title="Live Queue" value={String(activeOrders.length)} change={liveCapacity + "% max slot load"} icon={<Clock className="h-5 w-5" />} onClick={() => setActiveTab("Orders")} />
        <KpiCard title="Avg. Order Value" value={avgOrderValue} change="Paid orders" icon={<Clock3 className="h-5 w-5" />} onClick={() => setActiveTab("Analytics & Insights")} />
        <KpiCard title="Top Dish" value={topDish.length > 15 ? topDish.slice(0,15) + "…" : topDish} change="From orders" icon={<ChefHat className="h-5 w-5" />} onClick={() => setActiveTab("Menu Management")} />
        <KpiCard title="Busiest Hour" value={peakHour} change="Historical" icon={<Zap className="h-5 w-5" />} onClick={() => setActiveTab("Analytics & Insights")} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2"><LiveOrdersQueue orders={activeOrders} onUpdateStatus={updateOrderStatus} /></div>
        <div><SlotLoadViz slots={slots} /></div>
      </div>
    </div>
  );
};

export default DashboardOverview;