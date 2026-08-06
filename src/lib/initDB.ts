import mongoose from "mongoose";
import { connectDB } from "./db";

// Import all your models
import "../models/user.model";
import "../models/menuItem.model";
import "../models/favorite.model";
import "../models/order.model";
import "../models/transaction.model";
import "../models/notification.model";
import "../models/feedback-classification.model";
import "../models/admin.model";
import "../models/analytics.model";
import "../models/slot.model";
import "../models/staff.model";

// This function will be called when your application starts
export const initializeDB = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Get the default connection
    const db = mongoose.connection;

    // Log when connected
    db.on("connected", async () => {
      try {
        // List all collections to verify
        const mongoDb = db.getClient().db();
        const collections = await mongoDb.listCollections().toArray();

        collections.forEach((collection) => {});
      } catch (error) {}
    });

    // Log any errors after initial connection
    db.on("error", (err) => {});

    // Log when disconnected
    db.on("disconnected", () => {});
  } catch (error) {
    process.exit(1);
  }
};

// Export all models for easy access
export * from "../models/user.model";
export * from "../models/menuItem.model";
export * from "../models/favorite.model";
export * from "../models/order.model";
export {
  Transaction,
  type ITransaction,
  type PaymentMethod,
  type RefundStatus,
} from "../models/transaction.model";
export * from "../models/notification.model";
export * from "../models/feedback-classification.model";
export * from "../models/admin.model";
export * from "../models/analytics.model";
export * from "../models/slot.model";
export * from "../models/staff.model";
