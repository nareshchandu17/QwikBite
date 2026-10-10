import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { SlotService } from '../slotService';
import { TimeSlot } from '@/models/slot.model';
import { MenuItem } from '@/models/menuItem.model';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

describe('SlotService', () => {
  // Setup MongoMemoryServer before all tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);
  });

  // Cleanup after all tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Clear DB after each test
  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('validateSlotTiming', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      const mockNow = new Date('2026-08-23T12:00:00Z'); // 5:30 PM IST locally
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
      const result = SlotService.validateSlotTiming('05:00-05:30', 10);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/already passed/);
    });

    it('should reject a slot with insufficient prep time', () => {
      const result = SlotService.validateSlotTiming('05:45-06:15', 20);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/Insufficient time/);
    });

    it('should allow a valid future slot', () => {
      const result = SlotService.validateSlotTiming('06:00-06:30', 15);
      expect(result.valid).toBe(true);
    });
  });

  describe('reserveSlot (Real Concurrency Test)', () => {
    beforeEach(async () => {
      // Seed a single slot with maxLoad = 5
      await TimeSlot.create({
        dateOnly: '2026-08-25',
        startTime: new Date('2026-08-25T10:00:00.000Z'),
        endTime: new Date('2026-08-25T10:30:00.000Z'),
        timeSlot: '10:00-10:30',
        maxLoad: 5, // Extremely constrained capacity
        currentLoad: 0,
        kitchenCapacityFactor: 1,
        isActive: true,
        status: 'open'
      });
    });

    it('should handle N concurrent requests safely (atomic booking with real DB)', async () => {
      // We will fire 20 parallel reserveSlot calls
      // Each call requests a load of 1.
      // Since maxLoad is 5, exactly 5 should succeed, and 15 should fail (return null).
      
      const N = 20;
      const requestedLoadPerUser = 1;

      // Mock the SlotService.getSlotStartTime to return our exact UTC date to avoid timezone issues in the test
      const originalGetSlotStartTime = SlotService.getSlotStartTime;
      SlotService.getSlotStartTime = vi.fn().mockReturnValue(new Date('2026-08-25T10:00:00.000Z'));

      const promises = Array(N).fill(0).map(() => 
        SlotService.reserveSlot('10:00-10:30', '2026-08-25', requestedLoadPerUser)
      );

      // Execute all 20 reservations in parallel
      const results = await Promise.all(promises);
      
      // Restore original function
      SlotService.getSlotStartTime = originalGetSlotStartTime;

      const successfulBookings = results.filter(result => result !== null);
      const failedBookings = results.filter(result => result === null);

      // Exactly 5 reservations should have squeezed through
      expect(successfulBookings.length).toBe(5);
      // The remaining 15 were rejected natively by MongoDB's atomic evaluation
      expect(failedBookings.length).toBe(15);

      // Verify the final state in the database directly
      const finalSlot = await TimeSlot.findOne({ dateOnly: '2026-08-25' });
      expect(finalSlot?.currentLoad).toBe(5); // Load perfectly matches max capacity, no overbooking
    });

    it('should return null if capacity is full from a single large request', async () => {
      const originalGetSlotStartTime = SlotService.getSlotStartTime;
      SlotService.getSlotStartTime = vi
        .fn()
        .mockReturnValue(new Date('2026-08-25T10:00:00.000Z'));

      const result = await SlotService.reserveSlot(
        '10:00-10:30',
        '2026-08-25',
        10,
      );

      SlotService.getSlotStartTime = originalGetSlotStartTime;
      expect(result).toBeNull();
    });
  });

  describe('releaseSlot', () => {
    beforeEach(async () => {
      await TimeSlot.create({
        dateOnly: '2026-08-25',
        startTime: new Date('2026-08-25T10:00:00.000Z'),
        endTime: new Date('2026-08-25T10:30:00.000Z'),
        timeSlot: '10:00-10:30',
        maxLoad: 20,
        currentLoad: 15, // Already has load
        kitchenCapacityFactor: 1,
        isActive: true,
        status: 'open'
      });
    });

    it('should decrease the load for a slot (rollback)', async () => {
      const originalGetSlotStartTime = SlotService.getSlotStartTime;
      SlotService.getSlotStartTime = vi.fn().mockReturnValue(new Date('2026-08-25T10:00:00.000Z'));

      await SlotService.releaseSlot('10:00-10:30', '2026-08-25', 5);

      SlotService.getSlotStartTime = originalGetSlotStartTime;

      const slot = await TimeSlot.findOne({ dateOnly: '2026-08-25' });
      expect(slot?.currentLoad).toBe(10); // 15 - 5
    });
  });

  describe('calculateOrderLoad', () => {
    beforeEach(async () => {
      await MenuItem.create({
        id: '1',
        name: 'Item 1',
        price: 10,
        category: 'Food',
        preparationTime: 10,
        status: 'available',
        image: 'img1.jpg',
        images: ['img1.jpg']
      });
      await MenuItem.create({
        id: '2',
        name: 'Item 2',
        price: 15,
        category: 'Food',
        preparationTime: 5,
        status: 'available',
        image: 'img2.jpg',
        images: ['img2.jpg']
      });
    });

    it('should calculate total load based on menu item prep time', async () => {
      const items = [
        { id: '1', quantity: 2 },
        { id: '2', quantity: 3 }
      ];

      const load = await SlotService.calculateOrderLoad(items);
      // (10 * 2) + (5 * 3) = 35
      expect(load).toBe(35);
    });

    it('should reject an order load request when an item no longer exists', async () => {
      const items = [{ id: 'missing-id', quantity: 2 }];
      await expect(SlotService.calculateOrderLoad(items)).rejects.toThrow(
        /not found/,
      );
    });
  });
});
