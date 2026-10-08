"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, ChevronLeft, CheckCircle, Sunrise, Sun, Sunset, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";

type ApiSlot = {
  timeSlot: string; time: string; fill: number; percentage: number;
  status: "Open" | "Busy" | "Full"; statusMessage: string;
};

function periodOf(slot: string) {
  const hour = Number(slot.match(/^(\d{1,2})/)?.[1] || 0);
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 15) return "afternoon";
  return "evening";
}

export default function SlotSelectionPage() {
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const setTimeSlot = useCartStore((state) => state.setTimeSlot);

  useEffect(() => {
    let active = true;
    const loadSlots = async () => {
      try {
        const response = await fetch("/api/slots", { credentials: "include", cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Failed to load pickup slots");
        const data = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
        if (active) setSlots(data);
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "Failed to load pickup slots");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadSlots();
    const interval = setInterval(loadSlots, 20000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const grouped = useMemo(() => ({
    morning: slots.filter((slot) => periodOf(slot.timeSlot) === "morning"),
    afternoon: slots.filter((slot) => periodOf(slot.timeSlot) === "afternoon"),
    evening: slots.filter((slot) => periodOf(slot.timeSlot) === "evening"),
  }), [slots]);

  const handleConfirmSlot = () => {
    if (!selectedSlot) return toast.error("Please select a time slot");
    const selected = slots.find((slot) => slot.timeSlot === selectedSlot);
    if (!selected || selected.status === "Full") return toast.error("That slot is full. Please choose another.");
    setTimeSlot(selected.timeSlot);
    router.push("/customer/order-summary");
  };

  const renderGroup = (title: string, subtitle: string, Icon: React.ComponentType<{ className?: string }>, group: ApiSlot[]) => (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
      <div className="mb-6 flex items-center">
        <Icon className="mr-3 h-6 w-6 text-amber-400" />
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <span className="ml-3 text-sm text-slate-400">{subtitle}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {group.map((slot) => {
          const full = slot.status === "Full";
          const busy = slot.status === "Busy";
          return (
            <motion.button key={slot.timeSlot} whileHover={!full ? { scale: 1.03 } : undefined} whileTap={!full ? { scale: 0.98 } : undefined}
              onClick={() => !full && setSelectedSlot(slot.timeSlot)} disabled={full} title={slot.statusMessage}
              className={[
                "rounded-xl p-4 text-center transition-all",
                selectedSlot === slot.timeSlot ? "bg-amber-500 font-medium text-slate-900" : full ? "cursor-not-allowed bg-slate-800 text-slate-500" : busy ? "bg-amber-500/10 text-white ring-1 ring-amber-500/30 hover:bg-amber-500/20" : "bg-slate-700/50 text-white hover:bg-slate-700"
              ].join(" ")}
            >
              <Clock className="mx-auto mb-2 h-5 w-5" />
              <span className="block text-sm">{slot.timeSlot}</span>
              <span className="mt-1 block text-xs opacity-70">{full ? "Full" : busy ? slot.percentage + "% busy" : Math.max(0, 100 - slot.percentage) + "% capacity"}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center">
          <button onClick={() => router.back()} className="flex items-center text-slate-400 transition hover:text-white"><ChevronLeft className="mr-2 h-5 w-5" />Back</button>
          <h1 className="ml-4 text-2xl font-bold text-white">Select Pickup Time</h1>
        </div>
        <div className="mb-8"><div className="mb-2 flex items-center justify-between"><span className="text-sm text-slate-400">Step 1 of 3</span><span className="text-sm text-slate-400">Live slot availability</span></div><div className="h-2 w-full rounded-full bg-slate-700"><div className="h-2 w-1/3 rounded-full bg-amber-500" /></div></div>
        {selectedSlot && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center rounded-xl border border-amber-500/20 bg-amber-500/10 p-4"><CheckCircle className="mr-2 h-5 w-5 text-amber-400" /><span className="text-amber-300">Selected slot: {selectedSlot}</span></motion.div>}
        {loading ? <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-12 text-center"><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-amber-400" /><p className="text-slate-300">Loading live pickup capacity…</p></div> : slots.length === 0 ? <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-10 text-center text-slate-300">No pickup slots are currently available.</div> : <div className="space-y-8">{renderGroup("Morning", "(8:30 AM – 11:30 AM)", Sunrise, grouped.morning)}{renderGroup("Afternoon", "(11:31 AM – 2:30 PM)", Sun, grouped.afternoon)}{renderGroup("Evening", "(2:31 PM – 5:30 PM)", Sunset, grouped.evening)}</div>}
        <div className="mt-10"><motion.button whileHover={selectedSlot ? { scale: 1.02 } : undefined} whileTap={selectedSlot ? { scale: 0.98 } : undefined} onClick={handleConfirmSlot} disabled={!selectedSlot} className={["w-full rounded-xl py-4 text-lg font-medium transition-all", selectedSlot ? "bg-amber-500 text-slate-900 hover:bg-amber-600" : "cursor-not-allowed bg-slate-700 text-slate-500"].join(" ")}>Confirm Time Slot</motion.button><p className="mt-4 text-center text-sm text-slate-400">Capacity is checked again on the server when your order is placed.</p></div>
      </div>
    </div>
  );
}