/**
 * Central export file for all database models
 * Production-grade canteen management system
 */

// User Section Models
export { User, type IUser } from './User';
export { MenuItem, type IMenuItem, type INutritionInfo } from './MenuItem';
export { Favorite, type IFavorite } from './Favorite';
export { Transaction, type ITransaction } from './Transaction';
export { Notification, type INotification } from './Notification';
export { Order, type IOrder, type IOrderItem } from './Order';
export { default as Feedback, type IFeedback } from './Feedback';

// Admin Section Models
export { Admin, type IAdmin, type IAdminPermissions } from './Admin';
export { Analytics, type IAnalytics, type ITopItem, type ITopUser, type IPeakHour } from './Analytics';
export { AdminNotification, type IAdminNotification } from './AdminNotification';
export { TimeSlot, type ITimeSlot, SlotStatus } from '@/models/slot.model';
export { Staff, type IStaff, StaffRole } from '@/models/staff.model';

/**
 * Database Collections Summary:
 * 
 * USER SECTION (7 collections):
 * 1. users - Login + profile info
 * 2. menuitems - Food items catalog
 * 3. favorites - User favorite items
 * 4. transactions - Payment records
 * 5. notifications - User notifications
 * 6. orders - Order history (also serves as orderHistory)
 * 7. feedbacks - User reviews and ratings
 * 
 * ADMIN SECTION (3 collections):
 * 1. admins - Admin accounts and permissions
 * 2. analytics - Daily sales and insights
 * 3. adminnotifications - Broadcast notifications
 * 
 * Total: 10 production-ready collections with full indexing
 */

