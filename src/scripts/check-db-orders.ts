import logger from "@/lib/logger";
import { connectDB } from "../lib/db";
import { Order } from "../models/order.model";
import mongoose from "mongoose";

async function checkOrders() {
  try {
    logger.info("Connecting to DB...");
    await connectDB();
    logger.info("Connected.");

    const totalOrders = await Order.countDocuments();
    logger.info("Total orders in DB:", totalOrders);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    logger.info("Orders by status:", JSON.stringify(ordersByStatus, null, 2));

    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    logger.info("Recent 10 orders:");
    recentOrders.forEach((o: any) => {
      logger.info(
        `- ID: ${o.orderId || o._id}, Status: ${o.status}, CreatedAt: ${o.createdAt}, Items: ${o.items?.length}`,
      );
    });

    process.exit(0);
  } catch (err) {
    logger.error("Error:", err);
    process.exit(1);
  }
}

checkOrders();
