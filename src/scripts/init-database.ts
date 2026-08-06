import logger from "@/lib/logger";
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { MenuItem } from "../models/menuItem.model";
import { menuItems } from "../data/menu";
import { Favorite } from "../models/favorite.model";
import { Order } from "../lib/models/Order";
import { User } from "../models/user.model";

async function initDatabase() {
  try {
    await connectDB();

    logger.info("Initializing database collections...");

    // Initialize MenuItems collection
    const menuItemCount = await MenuItem.countDocuments();
    if (menuItemCount === 0) {
      logger.info("Seeding menu items...");
      await MenuItem.insertMany(
        menuItems.map((item) => ({
          ...item,
          _id: undefined,
        })),
      );
      logger.info(`Seeded ${menuItems.length} menu items`);
    } else {
      logger.info(`Menu items collection already has ${menuItemCount} items`);
    }

    // Initialize other collections (they'll be created automatically when first used)
    await Favorite.createCollection().catch(() =>
      logger.info("Favorites collection already exists"),
    );
    await Order.createCollection().catch(() =>
      logger.info("Orders collection already exists"),
    );
    await User.createCollection().catch(() =>
      logger.info("Users collection already exists"),
    );

    logger.info("Database initialization complete!");

    // Close the connection
    await mongoose.connection.close();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Error initializing database:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the init function
initDatabase();
