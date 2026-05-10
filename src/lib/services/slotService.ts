import { TimeSlot as TimeSlotModel, ITimeSlot } from '@/models/slot.model';
import { MenuItem } from '@/lib/models/MenuItem';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export class SlotService {
  /**
   * Helper to parse slot string and date into a normalized Start Time Date object
   */
  static getSlotStartTime(timeSlot: string, dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (timeSlot === 'ASAP') {
      const now = new Date();
      date.setHours(now.getHours(), now.getMinutes(), 0, 0);
      return date;
    }

    const startTimeStr = timeSlot.split('-')[0];
    const [hoursStr, minutesStr] = startTimeStr.split(':');
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);

    if (hours < 8) hours += 12; // PM adjustment
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Calculates the total load (prep time) for an order
   */
  static async calculateOrderLoad(items: unknown[]): Promise<number> {
    await connectDB();
    let totalLoad = 0;

    for (const item of items) {
      // Find menu item to get prep time
      const menuItem = await MenuItem.findOne({ 
        $or: [{ id: item.id }, { _id: mongoose.isValidObjectId(item.id) ? item.id : new mongoose.Types.ObjectId() }]
      });
      
      const prepTime = menuItem?.preparationTime || 5;
      totalLoad += prepTime * item.quantity;
    }

    return totalLoad;
  }

  /**
   * Atomically reserves capacity in a slot
   */
  static async reserveSlot(time: string, date: string, requestedLoad: number): Promise<ITimeSlot | null> {
    await connectDB();
    const startTime = this.getSlotStartTime(time, date);

    // Atomic capacity check and increment
    const updatedSlot = await TimeSlotModel.findOneAndUpdate(
      {
        dateOnly: date,
        startTime: startTime,
        isActive: true,
        $expr: {
          $lte: [
            { $add: ['$currentLoad', requestedLoad] },
            { $multiply: ['$maxLoad', '$kitchenCapacityFactor'] }
          ]
        }
      },
      {
        $inc: { currentLoad: requestedLoad }
      },
      { 
        new: true,
        upsert: false 
      }
    );

    if (updatedSlot) {
      // The pre-save hook in slot.model.ts will handle status and wait time updates
      // However, findOneAndUpdate doesn't trigger pre-save hooks automatically for all fields
      // So we manually trigger a save if we want the hook logic to run, or we rely on the next sync.
      // For performance, we'll let the next sync or a manual update handle status.
      await updatedSlot.save(); 
    }

    return updatedSlot;
  }

  /**
   * Releases capacity from a slot (used for rollbacks)
   */
  static async releaseSlot(time: string, date: string, loadToRelease: number): Promise<void> {
    await connectDB();
    const startTime = this.getSlotStartTime(time, date);

    const slot = await TimeSlotModel.findOneAndUpdate(
      { dateOnly: date, startTime: startTime },
      {
        $inc: { currentLoad: -loadToRelease }
      },
      { new: true }
    );

    if (slot) {
      await slot.save(); // Trigger hooks to update status
    }
  }

  /**
   * Validates if the slot is still in the future and accounts for prep time
   */
  static validateSlotTiming(timeSlot: string, prepTime: number): { valid: boolean; _error?: string } {
    if (timeSlot === 'ASAP') return { valid: true };

    const istOffset = 330;
    const now = new Date();
    const istNow = new Date(now.getTime() + (istOffset * 60000));
    
    // Parse slot start time
    const startTimeStr = timeSlot.split('-')[0];
    const [hoursStr, minutesStr] = startTimeStr.split(':');
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);

    if (hours < 8) hours += 12;

    const slotStartTime = new Date(istNow);
    slotStartTime.setHours(hours, minutes, 0, 0);

    if (slotStartTime < istNow) {
      return { valid: false, _error: 'Cannot book a slot that has already passed.' };
    }

    const minutesUntilSlot = (slotStartTime.getTime() - istNow.getTime()) / 60000;
    if (minutesUntilSlot < prepTime) {
      return { valid: false, _error: `Insufficient time to prepare your order for this slot (Needs ${prepTime} mins).` };
    }

    return { valid: true };
  }
}
