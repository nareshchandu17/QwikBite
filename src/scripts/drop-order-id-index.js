import logger from "@/lib/logger";
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

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
    await mongoose.connect(MONGODB_URI);
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
  } catch (error) {
    logger.error("❌ Error dropping index:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
    process.exit(0);
  }
}

dropIndex();
