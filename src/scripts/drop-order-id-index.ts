import logger from "@/lib/logger";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  logger.error("❌ MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

async function dropIndex() {
  try {
    logger.info("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    logger.info("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error(
        "Database connection established but db object is undefined",
      );
    }
    const collection = db.collection("orders");

    logger.info('Checking indexes on "orders" collection...');
    const indexes = await collection.indexes();
    logger.info("Current indexes:", JSON.stringify(indexes, null, 2));

    const idIndexExists = indexes.some((idx) => idx.name === "id_1");

    if (idIndexExists) {
      logger.info('Dropping index "id_1"...');
      await collection.dropIndex("id_1");
      logger.info('✅ Successfully dropped index "id_1"');
    } else {
      logger.info(
        'ℹ️ Index "id_1" not found. It might have already been dropped or has a different name.',
      );
    }

    // Also check for orderId index
    const orderIdIndexExists = indexes.some((idx) => idx.name === "orderId_1");
    if (!orderIdIndexExists) {
      logger.info(
        "Note: orderId_1 index not found. Mongoose will likely create it automatically based on the schema.",
      );
    }
  } catch (error) {
    logger.error("❌ Error dropping index:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
    process.exit(0);
  }
}

dropIndex();
