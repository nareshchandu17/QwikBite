import { Order } from "@/lib/models/Order";
import { TimeSlot as TimeSlotModel } from "@/models/slot.model";
import { connectDB } from "./db";

export const STANDARD_SLOTS = [
  "ASAP",
  "8:30-9:00",
  "9:01-9:30",
  "9:31-10:00",
  "10:01-10:30",
  "10:30-11:00",
  "11:01-11:30",
  "11:31-12:00",
  "12:01-12:30",
  "12:31-1:00",
  "1:01-1:30",
  "1:31-2:00",
  "2:01-2:30",
  "2:31-3:00",
  "3:01-3:30",
  "3:31-4:00",
  "4:01-4:30",
  "4:31-5:00",
  "5:01-5:30",
];

function parseTimePart(part: string) {
  const value = part.trim();
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error("Invalid slot time");

  let h = Number(match[1]);
  const m = Number(match[2]);

  if (h > 23 || m > 59) throw new Error("Invalid slot time");
  if (h >= 1 && h < 8) h += 12;

  return { h, m };
}

export function parseSlotToDates(
  slotStr: string,
  dateStr: string,
): { start: Date; end: Date } {
  if (slotStr === "ASAP") {
    const now = new Date();
    return { start: now, end: new Date(now.getTime() + 30 * 60000) };
  }

  const [startPart, endPart] = slotStr.split("-");
  if (!startPart || !endPart) throw new Error("Invalid time slot");

  const startTime = parseTimePart(startPart);
  const endTime = parseTimePart(endPart);

  const start = new Date(
    `${dateStr}T${String(startTime.h).padStart(2, "0")}:${String(startTime.m).padStart(2, "0")}:00+05:30`,
  );
  const end = new Date(
    `${dateStr}T${String(endTime.h).padStart(2, "0")}:${String(endTime.m).padStart(2, "0")}:00+05:30`,
  );

  return { start, end };
}

export async function syncTimeSlotUsage(targetDate?: string): Promise<void> {
  await connectDB();

  const dateStr =
    targetDate ||
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());

  const orders = await Order.find({
    pickupDate: dateStr,
    status: { $nin: ["cancelled", "completed"] },
    $or: [
      { paymentMethod: { $ne: "stripe" } },
      { paymentStatus: "paid" },
      { reservationExpiresAt: { $gte: new Date() } },
    ],
  }).lean();

  const slotStats: Record<string, number> = {};
  for (const order of orders) {
    if (!order.timeSlot) continue;
    slotStats[order.timeSlot] =
      (slotStats[order.timeSlot] || 0) + (order.loadValue || 0);
  }

  const persistedSlots = await TimeSlotModel.find({ dateOnly: dateStr });
  const byStart = new Map(
    persistedSlots.map((slot) => [slot.startTime.getTime(), slot]),
  );

  const updates = STANDARD_SLOTS.filter((slot) => slot !== "ASAP").map(
    async (slotStr) => {
      const { start, end } = parseSlotToDates(slotStr, dateStr);
      const existing = byStart.get(start.getTime());

      if (!existing) {
        await TimeSlotModel.create({
          startTime: start,
          endTime: end,
          dateOnly: dateStr,
          maxLoad: 300,
          currentLoad: slotStats[slotStr] || 0,
          kitchenCapacityFactor: 1,
          isActive: true,
        });
        return;
      }

      existing.currentLoad = slotStats[slotStr] || 0;
      existing.endTime = end;
      await existing.save();
    },
  );

  await Promise.all(updates);
}

export async function aggregateTimeSlots() {
  await connectDB();

  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const dbSlots = await TimeSlotModel.find({ dateOnly: dateStr })
    .sort({ startTime: 1 })
    .lean();

  const DEFAULT_MAX_LOAD = 300;

  const standardSlots = STANDARD_SLOTS.filter((slot) => slot !== "ASAP").map(
    (slot) => {
      const { start } = parseSlotToDates(slot, dateStr);
      const dbMatch = dbSlots.find(
        (ds) => ds.startTime.getTime() === start.getTime(),
      );

      const currentLoad = dbMatch?.currentLoad || 0;
      const maxLoad = dbMatch?.maxLoad || DEFAULT_MAX_LOAD;
      const effectiveMax = Math.max(
        1,
        maxLoad * (dbMatch?.kitchenCapacityFactor || 1),
      );
      const percentage = Math.min(
        100,
        Math.round((currentLoad / effectiveMax) * 100),
      );

      return {
        time: slot,
        timeSlot: slot,
        capacity: Math.round(effectiveMax),
        used: currentLoad,
        percentage,
        status:
          dbMatch?.isActive === false
            ? "closed"
            : currentLoad >= effectiveMax
              ? "full"
              : currentLoad >= effectiveMax * 0.7
                ? "busy"
                : "open",
      };
    },
  );

  const firstOpen = standardSlots.find(
    (slot) => slot.status !== "full" && slot.percentage < 100,
  );

  return [
    {
      time: "ASAP",
      timeSlot: "ASAP",
      capacity: firstOpen?.capacity || DEFAULT_MAX_LOAD,
      used: firstOpen?.used || 0,
      percentage: firstOpen?.percentage || 0,
      status: firstOpen?.status || "open",
    },
    ...standardSlots,
  ];
}
