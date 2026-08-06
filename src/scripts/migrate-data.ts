import logger from "@/lib/logger";
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { User } from "../models/user.model";
import { Order } from "../lib/models/Order";
import { MenuItem } from "../models/menuItem.model";
import { menuItems as staticMenuItems } from "../data/menu";

// Define the old UserLogin schema for migration
const oldUserLoginSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
  loginTime: Date,
  createdAt: { type: Date, default: Date.now },
});

async function migrateData() {
  try {
    await connectDB();

    logger.info("Starting data migration...");

    // 1. Migrate UserLogin records to Users collection
    const db = mongoose.connection.useDb(process.env.MONGODB_DB as string);
    const OldUserLogin = db.model("UserLogin", oldUserLoginSchema);

    const userLogins = await OldUserLogin.find({});
    logger.info(`Found ${userLogins.length} user login records to migrate`);

    for (const login of userLogins) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: login.email });

      if (!existingUser) {
        // Create new user
        const newUser = new User({
          name: login.name,
          email: login.email,
          role: login.role,
          regNo: `MIG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          password: "", // Empty password for migrated users
        });

        await newUser.save();
        logger.info(`Migrated user: ${login.email}`);
      } else {
        logger.info(`User already exists: ${login.email}`);
      }
    }

    // 2. Seed menu items if not already present
    const menuItemCount = await MenuItem.countDocuments();
    if (menuItemCount === 0) {
      logger.info("Seeding menu items...");
      await MenuItem.insertMany(
        staticMenuItems.map((item) => ({
          ...item,
          _id: undefined,
        })),
      );
      logger.info(`Seeded ${staticMenuItems.length} menu items`);
    } else {
      logger.info(`Menu items already exist: ${menuItemCount} items`);
    }

    // 3. Update existing orders to include userId if missing
    const ordersWithoutUserId = await Order.find({ user: { $exists: false } });
    logger.info(`Found ${ordersWithoutUserId.length} orders without user`);

    for (const order of ordersWithoutUserId) {
      // For existing orders, set user to "anonymous" or try to find matching user
      order.user = "anonymous";
      await order.save();
      logger.info(`Updated order ${order.id} with user`);
    }

    logger.info("Data migration completed successfully!");

    // Close the connection
    await mongoose.connection.close();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Error during data migration:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration function
migrateData();
