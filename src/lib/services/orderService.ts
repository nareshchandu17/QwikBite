import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { MenuItem } from "@/models/menuItem.model";
import { Order, OrderStatus, PaymentStatus } from "@/models/order.model";
import { SlotService } from "@/lib/services/slotService";

export class OrderServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

type RequestedItem = {
  id?: string | number;
  menuItem?: string | number;
  quantity?: number;
};

type CreateOrderInput = {
  userId: string;
  items: RequestedItem[];
  timeSlot: string;
  pickupDate?: string;
  paymentMethod: "cod" | "cash" | "stripe" | "card" | "upi" | "wallet";
  idempotencyKey?: string;
  username?: string;
};

const TAX_RATE = 0.05;
const ALLOWED_PAYMENT_METHODS = new Set([
  "cod",
  "cash",
  "stripe",
  "card",
  "upi",
  "wallet",
]);

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getISTDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

function assertDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new OrderServiceError("Invalid pickup date.", "INVALID_DATE", 400);
  }
}

export async function createOrderForUser(input: CreateOrderInput) {
  await connectDB();

  const userId = String(input.userId);
  if (!mongoose.isValidObjectId(userId)) {
    throw new OrderServiceError("Invalid user.", "INVALID_USER", 400);
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new OrderServiceError(
      "Order must contain at least one item.",
      "INVALID_ITEMS",
      400,
    );
  }

  if (input.items.length > 50) {
    throw new OrderServiceError(
      "Order contains too many distinct items.",
      "INVALID_ITEMS",
      400,
    );
  }

  const paymentMethod = String(input.paymentMethod || "").toLowerCase();
  if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
    throw new OrderServiceError(
      "Unsupported payment method.",
      "INVALID_PAYMENT_METHOD",
      400,
    );
  }

  const pickupDate = input.pickupDate || getISTDateString();
  assertDate(pickupDate);

  const idempotencyKey = input.idempotencyKey?.trim();
  if (
    idempotencyKey &&
    (idempotencyKey.length < 8 || idempotencyKey.length > 128)
  ) {
    throw new OrderServiceError(
      "Invalid idempotency key.",
      "INVALID_IDEMPOTENCY_KEY",
      400,
    );
  }

  if (idempotencyKey) {
    const existing = await Order.findOne({
      user: userId,
      idempotencyKey,
    }).lean();

    if (existing) return { order: existing, reused: true };
  }

  const requested = input.items.map((item, index) => {
    const rawId = item.id ?? item.menuItem;
    const id = rawId == null ? "" : String(rawId);
    const quantity = Number(item.quantity);

    if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      throw new OrderServiceError(
        `Invalid item or quantity at position ${index + 1}.`,
        "INVALID_ITEMS",
        400,
      );
    }

    return { id, quantity };
  });

  const ids = [...new Set(requested.map((item) => item.id))];
  const objectIds = ids.filter((id) => mongoose.isValidObjectId(id));
  const menuQuery: Record<string, unknown>[] = [{ id: { $in: ids } }];

  if (objectIds.length > 0) {
    menuQuery.push({ _id: { $in: objectIds } });
  }

  const menuItems = await MenuItem.find({ $or: menuQuery }).lean();
  const byId = new Map<string, (typeof menuItems)[number]>();

  for (const item of menuItems) {
    byId.set(String(item.id), item);
    byId.set(String(item._id), item);
  }

  let subtotal = 0;
  let loadValue = 0;
  const normalizedItems = [];

  for (const requestedItem of requested) {
    const menuItem = byId.get(requestedItem.id);

    if (!menuItem) {
      throw new OrderServiceError(
        `Menu item ${requestedItem.id} no longer exists.`,
        "ITEM_NOT_FOUND",
        409,
      );
    }

    if (!menuItem.isAvailable) {
      throw new OrderServiceError(
        `${menuItem.name} is currently unavailable.`,
        "ITEM_UNAVAILABLE",
        409,
      );
    }

    subtotal += roundMoney(menuItem.price * requestedItem.quantity);
    loadValue += menuItem.preparationTime * requestedItem.quantity;

    normalizedItems.push({
      menuItem: menuItem.id,
      name: menuItem.name,
      image: menuItem.image,
      quantity: requestedItem.quantity,
      price: menuItem.price,
      prepTime: menuItem.preparationTime,
    });
  }

  subtotal = roundMoney(subtotal);
  const taxAmount = roundMoney(subtotal * TAX_RATE);
  const totalAmount = roundMoney(subtotal + taxAmount);

  const timing = SlotService.validateSlotTiming(input.timeSlot, loadValue, pickupDate);
  if (!timing.valid) {
    throw new OrderServiceError(
      timing.error || "Invalid pickup slot.",
      "INVALID_SLOT",
      400,
    );
  }

  let targetTimeSlot = input.timeSlot;

  if (targetTimeSlot === "ASAP") {
    const nextSlot = await SlotService.getEarliestAvailableSlot(
      pickupDate,
      loadValue,
    );

    if (!nextSlot) {
      throw new OrderServiceError(
        "No suitable pickup slot is currently available.",
        "SLOT_FULL",
        409,
      );
    }

    targetTimeSlot = nextSlot.timeSlot;
  }

  const reservedSlot = await SlotService.reserveSlot(
    targetTimeSlot,
    pickupDate,
    loadValue,
  );

  if (!reservedSlot) {
    throw new OrderServiceError(
      "The selected pickup slot is full. Please choose another slot.",
      "SLOT_FULL",
      409,
    );
  }

  try {
    const order = new Order({
      user: userId,
      items: normalizedItems,
      subtotal,
      taxAmount,
      totalAmount,
      price: totalAmount,
      total: totalAmount,
      currency: "INR",
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod,
      slot: reservedSlot._id,
      pickupTime: reservedSlot.startTime,
      pickupDate,
      timeSlot: targetTimeSlot,
      loadValue,
      username: input.username,
      idempotencyKey,
      isCancelled: false,
    });

    await order.save();

    return { order: order.toObject(), reused: false };
  } catch (error: any) {
    await SlotService.releaseSlot(targetTimeSlot, pickupDate, loadValue);

    if (error?.code === 11000 && idempotencyKey) {
      const existing = await Order.findOne({
        user: userId,
        idempotencyKey,
      }).lean();

      if (existing) return { order: existing, reused: true };
    }

    throw error;
  }
}
