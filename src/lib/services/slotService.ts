import { TimeSlot as TimeSlotModel, ITimeSlot } from "@/models/slot.model";
import { MenuItem } from "@/models/menuItem.model";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

interface RawOrderItem {
  id: string;
  quantity: number;
  [key: string]: any;
}

function parseTimePart(part: string) {
  const value = part.trim().toLowerCase();
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error("Invalid slot time");

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error("Invalid slot time");
  if (hours >= 1 && hours < 8) hours += 12;

  return { hours, minutes };
}

export class SlotService {
  static getSlotStartTime(timeSlot: string, dateStr: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new Error("Invalid date");
    }

    if (timeSlot === "ASAP") return new Date();

    const { hours, minutes } = parseTimePart(timeSlot.split("-")[0]);
    return new Date(
      `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`,
    );
  }

  static async calculateOrderLoad(items: RawOrderItem[]): Promise<number> {
    await connectDB();

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    const requested = items.map((item) => {
      const id = String(item.id || "");
      const quantity = Number(item.quantity);
      if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        throw new Error("Invalid item or quantity");
      }
      return { id, quantity };
    });

    const ids = [...new Set(requested.map((item) => item.id))];
    const objectIds = ids.filter((id) => mongoose.isValidObjectId(id));
    const query: Record<string, unknown>[] = [{ id: { $in: ids } }];
    if (objectIds.length) query.push({ _id: { $in: objectIds } });

    const menuItems = await MenuItem.find({ $or: query }).lean();
    const byId = new Map<string, (typeof menuItems)[number]>();

    for (const item of menuItems) {
      byId.set(String(item.id), item);
      byId.set(String(item._id), item);
    }

    return requested.reduce((total, item) => {
      const menuItem = byId.get(item.id);
      if (!menuItem) throw new Error(`Menu item ${item.id} not found`);
      if (!menuItem.isAvailable) {
        throw new Error(`${menuItem.name} is currently unavailable`);
      }
      return total + menuItem.preparationTime * item.quantity;
    }, 0);
  }

  static async getEarliestAvailableSlot(
    date: string,
    requestedLoad: number,
  ): Promise<(ITimeSlot & { timeSlot: string }) | null> {
    await connectDB();

    const candidates = await TimeSlotModel.find({
      dateOnly: date,
      isActive: true,
    }).sort({ startTime: 1 });

    for (const slot of candidates) {
      if (slot.startTime.getTime() < Date.now()) continue;
      if (!slot.hasCapacity(requestedLoad)) continue;

      const label = slot.startTime.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const endLabel = slot.endTime.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return Object.assign(slot, {
        timeSlot: `${label}-${endLabel}`,
      });
    }

    return null;
  }

  static async reserveSlot(
    time: string,
    date: string,
    requestedLoad: number,
  ): Promise<ITimeSlot | null> {
    await connectDB();

    if (!Number.isFinite(requestedLoad) || requestedLoad <= 0) {
      throw new Error("Invalid requested load");
    }

    const startTime = this.getSlotStartTime(time, date);

    const updatedSlot = await TimeSlotModel.findOneAndUpdate(
      {
        dateOnly: date,
        startTime,
        isActive: true,
        $expr: {
          $lte: [
            { $add: ["$currentLoad", requestedLoad] },
            { $multiply: ["$maxLoad", "$kitchenCapacityFactor"] },
          ],
        },
      },
      { $inc: { currentLoad: requestedLoad } },
      { new: true, upsert: false },
    );

    if (updatedSlot) {
      const effectiveMax =
        updatedSlot.maxLoad * updatedSlot.kitchenCapacityFactor;
      updatedSlot.status =
        updatedSlot.currentLoad >= effectiveMax
          ? "full"
          : updatedSlot.isActive
            ? "open"
            : "closed";

      if (effectiveMax > 0 && updatedSlot.avgPrepTime > 0) {
        updatedSlot.estimatedWaitTime = Math.ceil(
          (updatedSlot.currentLoad / effectiveMax) *
            updatedSlot.avgPrepTime,
        );
      }

      await updatedSlot.save();
    }

    return updatedSlot;
  }

  static async releaseSlot(
    time: string,
    date: string,
    loadToRelease: number,
  ): Promise<void> {
    await connectDB();
    if (!Number.isFinite(loadToRelease) || loadToRelease <= 0) return;

    const startTime = this.getSlotStartTime(time, date);
    const slot = await TimeSlotModel.findOneAndUpdate(
      {
        dateOnly: date,
        startTime,
        currentLoad: { $gte: loadToRelease },
      },
      { $inc: { currentLoad: -loadToRelease } },
      { new: true },
    );

    if (slot) {
      const effectiveMax =
        slot.maxLoad * slot.kitchenCapacityFactor;
      slot.status =
        slot.currentLoad >= effectiveMax
          ? "full"
          : slot.isActive
            ? "open"
            : "closed";
      await slot.save();
    }
  }

  static validateSlotTiming(
    timeSlot: string,
    prepTime: number,
  ): { valid: boolean; error?: string } {
    if (!timeSlot) {
      return { valid: false, error: "Pickup time slot is required." };
    }

    if (timeSlot === "ASAP") return { valid: true };

    let slotStartTime: Date;
    try {
      const now = new Date();
      const istDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
      }).format(now);
      slotStartTime = this.getSlotStartTime(timeSlot, istDate);
    } catch {
      return { valid: false, error: "Invalid time slot format." };
    }

    const minutesUntilSlot =
      (slotStartTime.getTime() - Date.now()) / 60000;

    if (minutesUntilSlot < 0) {
      return {
        valid: false,
        error: "Cannot book a slot that has already passed.",
      };
    }

    if (minutesUntilSlot < prepTime) {
      return {
        valid: false,
        error: `Insufficient time to prepare your order for this slot (needs ${prepTime} mins).`,
      };
    }

    return { valid: true };
  }
}
