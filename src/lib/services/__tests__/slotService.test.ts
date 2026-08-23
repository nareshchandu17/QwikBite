import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SlotService } from '../slotService';
import { TimeSlot } from '@/models/slot.model';
import { MenuItem } from '@/models/menuItem.model';
import * as db from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  connectDB: vi.fn(),
}));

vi.mock('@/models/slot.model', () => ({
  TimeSlot: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('@/models/menuItem.model', () => ({
  MenuItem: {
    findOne: vi.fn(),
  },
}));

describe('SlotService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateSlotTiming', () => {
    beforeEach(() => {
      // Mock new Date() for predictable tests
      vi.useFakeTimers();
      const mockNow = new Date('2026-08-23T12:00:00Z'); // 5:30 PM IST
      vi.setSystemTime(mockNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should always allow ASAP slots', () => {
      const result = SlotService.validateSlotTiming('ASAP', 15);
      expect(result.valid).toBe(true);
    });

    it('should reject a slot that has already passed', () => {
      // Current time is 5:30 PM IST (12:00 UTC). A 5:00 PM slot is in the past.
      const result = SlotService.validateSlotTiming('05:00-05:30', 10);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/already passed/);
    });

    it('should reject a slot with insufficient prep time', () => {
      // Current time is 5:30 PM IST. A 5:45 PM slot is 15 mins away. Needs 20 mins.
      const result = SlotService.validateSlotTiming('05:45-06:15', 20);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/Insufficient time/);
    });

    it('should allow a valid future slot', () => {
      // Current time is 5:30 PM IST. A 6:00 PM slot is 30 mins away. Needs 15 mins.
      const result = SlotService.validateSlotTiming('06:00-06:30', 15);
      expect(result.valid).toBe(true);
    });
  });

  describe('reserveSlot', () => {
    it('should attempt atomic booking with capacity limits', async () => {
      const mockSlot = { _id: 'slot1', save: vi.fn() };
      (TimeSlot.findOneAndUpdate as any).mockResolvedValue(mockSlot);

      const result = await SlotService.reserveSlot('10:00-10:30', '2026-08-25', 15);

      expect(db.connectDB).toHaveBeenCalled();
      expect(TimeSlot.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          dateOnly: '2026-08-25',
          isActive: true,
          $expr: expect.objectContaining({
            $lte: [
              { $add: ['$currentLoad', 15] },
              { $multiply: ['$maxLoad', '$kitchenCapacityFactor'] },
            ],
          }),
        }),
        { $inc: { currentLoad: 15 } },
        { new: true, upsert: false }
      );
      expect(mockSlot.save).toHaveBeenCalled();
      expect(result).toBe(mockSlot);
    });

    it('should return null if capacity is full', async () => {
      (TimeSlot.findOneAndUpdate as any).mockResolvedValue(null);
      const result = await SlotService.reserveSlot('10:00-10:30', '2026-08-25', 500);
      expect(result).toBeNull();
    });
  });

  describe('releaseSlot', () => {
    it('should decrease the load for a slot (rollback)', async () => {
      const mockSlot = { _id: 'slot1', save: vi.fn() };
      (TimeSlot.findOneAndUpdate as any).mockResolvedValue(mockSlot);

      await SlotService.releaseSlot('10:00-10:30', '2026-08-25', 15);

      expect(TimeSlot.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          dateOnly: '2026-08-25',
        }),
        { $inc: { currentLoad: -15 } },
        { new: true }
      );
      expect(mockSlot.save).toHaveBeenCalled();
    });
  });

  describe('calculateOrderLoad', () => {
    it('should calculate total load based on menu item prep time', async () => {
      (MenuItem.findOne as any)
        .mockResolvedValueOnce({ preparationTime: 10 }) // Item 1
        .mockResolvedValueOnce({ preparationTime: 5 });  // Item 2

      const items = [
        { id: '1', quantity: 2 },
        { id: '2', quantity: 3 }
      ];

      const load = await SlotService.calculateOrderLoad(items);
      // (10 * 2) + (5 * 3) = 35
      expect(load).toBe(35);
    });

    it('should use default 5 mins if item not found', async () => {
      (MenuItem.findOne as any).mockResolvedValue(null);

      const items = [{ id: '1', quantity: 2 }];
      const load = await SlotService.calculateOrderLoad(items);
      // (5 * 2) = 10
      expect(load).toBe(10);
    });
  });
});
