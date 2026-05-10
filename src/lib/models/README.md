# Production-Grade Database Schema

This folder contains all database models for the Canteen Management System. Each model is production-ready with proper indexing, validation, and real-time support.

## 📊 Database Structure

### USER SECTION

#### 1. **users** - User Accounts
- `userId` - Unique user identifier (auto-generated)
- `name` - Full name
- `email` - Email address (unique, indexed)
- `phone` - Phone number (optional)
- `password` - Hashed password
- `profilePic` - Profile image URL
- `role` - user | customer | admin | staff
- `walletBalance` - Prepaid balance (default: 0)
- `address` - Delivery/pickup address
- `createdAt`, `updatedAt` - Timestamps

**Indexes**: email, regNo, role, createdAt

---

#### 2. **menuitems** - Food Catalog
- `itemId` - Unique item identifier
- `name` - Item name
- `description` - Item description
- `price` - Price (min: 0)
- `image` - Item image URL
- `category` - snacks | beverages | meals | etc.
- `availability` - In stock status
- `rating` - Average rating (0-5)
- `totalOrders` - Number of times ordered
- `nutritionInfo` - Calories, protein, carbs, fat, fiber
- `preparationTime` - Time in minutes
- `tags` - Array of tags for filtering
- `createdAt`, `updatedAt` - Timestamps

**Indexes**: category, availability, rating, totalOrders, tags, text search

---

#### 3. **favorites** - User Favorites
- `favoriteId` - Unique identifier
- `userId` - Reference to user
- `favoriteItems` - Array of itemIds
- `timestamp` - When added
- `createdAt`, `updatedAt` - Timestamps

**Indexes**: userId, favoriteItems

---

#### 4. **transactions** - Payment Records
- `transactionId` - Unique transaction ID (auto-generated)
- `userId` - Reference to user
- `orderId` - Reference to order
- `amount` - Transaction amount
- `paymentMethod` - upi | wallet | card | cash | stripe
- `paymentStatus` - success | pending | failed | refunded
- `receiptURL` - Receipt document URL
- `refundStatus` - Refund processing status
- `refundAmount` - Refund amount
- `refundReason` - Reason for refund
- `createdAt`, `updatedAt` - Timestamps

**Indexes**: userId, orderId, paymentStatus, createdAt

---

#### 5. **notifications** - User Notifications
- `notificationId` - Unique identifier
- `userId` - Reference to user
- `message` - Notification message
- `title` - Notification title
- `type` - order_update | promo | system | payment | offer
- `isRead` - Read status
- `deepLink` - URL to open
- `data` - Additional metadata
- `priority` - low | medium | high
- `expiresAt` - Expiration date (TTL)
- `createdAt`, `updatedAt` - Timestamps

**Indexes**: userId + isRead, userId + createdAt, type, expiresAt (TTL)

---

#### 6. **orders** - Order History
- `orderId` - Unique order ID
- `userId` - Reference to user
- `items` - Array of order items
- `total` - Total amount
- `paymentMethod` - Payment method used
- `paymentStatus` - pending | completed | failed | refunded
- `status` - received | preparing | almost_ready | ready | collected
- `timeSlot` - Pickup time slot
- `feedbackGiven` - Whether feedback submitted
- `rating` - Order rating
- `comment` - Order comment
- `createdAt`, `updatedAt` - Timestamps

**Indexes**: userId, status, paymentStatus, createdAt

---

#### 7. **feedbacks** - User Reviews
- `feedbackId` - Unique identifier
- `userId` - Reference to user
- `orderId` - Reference to order (optional)
- `itemId` - Reference to item (optional)
- `rating` - Rating (1-5)
- `category` - food | hygiene | delivery | service | others
- `comment` - Feedback text
- `images` - Array of image URLs
- `reportIssue` - Issue flags (hygiene, delay, quality, quantity)
- `status` - submitted | under_review | resolved | closed
- `adminReply` - Admin response
- `adminRepliedAt` - Reply timestamp
- `isPublic` - Show in public reviews
- `helpful` - Helpful count
- `createdAt`, `updatedAt` - Timestamps

**Indexes**: userId, orderId, itemId, category, status, rating, isPublic

---

### ADMIN SECTION

#### 1. **admins** - Admin Accounts
- `adminId` - Unique admin identifier (auto-generated)
- `name` - Admin name
- `email` - Email (unique)
- `phone` - Phone number
- `password` - Hashed password
- `profilePic` - Profile image
- `role` - superAdmin | admin | staff | manager
- `permissions` - Permission object
  - `menuEdit` - Can edit menu
  - `orderManage` - Can manage orders
  - `userManage` - Can manage users
  - `analyticsView` - Can view analytics
  - `feedbackManage` - Can manage feedback
  - `notificationSend` - Can send notifications
  - `paymentManage` - Can manage payments
  - `reportGenerate` - Can generate reports
- `isActive` - Account status
- `lastLogin` - Last login timestamp
- `loginAttempts` - Failed login count
- `lockedUntil` - Account lock expiry
- `createdBy` - Admin who created this account
- `createdAt`, `updatedAt` - Timestamps

**Indexes**: email, role + isActive, createdAt

---

#### 2. **analytics** - Daily Analytics
- `analyticsId` - Unique identifier (date-based)
- `date` - Analytics date (unique, one per day)
- `totalSales` - Total sales count
- `totalOrders` - Total orders count
- `totalRevenue` - Total revenue
- `averageOrderValue` - Avg order value (auto-calculated)
- `cancelledOrders` - Cancelled count
- `refundedAmount` - Total refunds
- `mostOrderedItems` - Top items array
- `leastOrderedItems` - Bottom items array
- `peakHours` - Hourly breakdown (0-23)
- `topUsers` - Top customers
- `newUsers` - New user count
- `returningUsers` - Returning user count
- `paymentMethodBreakdown` - Payment split
- `categoryWiseSales` - Category breakdown
- `createdAt`, `updatedAt` - Timestamps

**Indexes**: date, totalRevenue, totalOrders, createdAt

---

#### 3. **adminnotifications** - Broadcast Notifications
- `notificationId` - Unique identifier
- `message` - Notification message
- `title` - Notification title
- `type` - broadcast | targeted | scheduled | promotional
- `targetUsers` - 'all' or array of userIds
- `targetSegment` - new_users | active_users | inactive_users | high_value
- `scheduledAt` - Schedule time
- `sentAt` - Sent timestamp
- `sentBy` - Admin ID
- `status` - draft | scheduled | sent | failed | cancelled
- `deliveryStatus` - Delivery statistics
- `deepLink` - URL to open
- `imageUrl` - Notification image
- `actionButton` - CTA button
- `expiresAt` - Expiration date
- `createdAt`, `updatedAt` - Timestamps

**Indexes**: sentBy, status + scheduledAt, type, createdAt

---

## 🚀 Features

### Production-Ready
✅ Auto-generated IDs for all models  
✅ Comprehensive indexing for fast queries  
✅ Input validation and constraints  
✅ Timestamps (createdAt, updatedAt)  
✅ Proper relationships (refs)  
✅ TTL indexes for expiring data  
✅ Text search support  
✅ Compound indexes for complex queries  

### Real-Time Support
✅ WebSocket-friendly structure  
✅ Status tracking for live updates  
✅ Notification system  
✅ Order status tracking  

### Security
✅ Password select: false (not returned by default)  
✅ Role-based access control  
✅ Login attempt tracking  
✅ Account locking mechanism  
✅ Permission system for admins  

### Analytics & Reporting
✅ Daily analytics with auto-calculation  
✅ Peak hours tracking  
✅ Top items/users analysis  
✅ Payment method breakdown  
✅ Category-wise sales  

---

## 📦 Usage

```typescript
// Import all models
import {
  User,
  MenuItem,
  Favorite,
  Transaction,
  Notification,
  Order,
  Feedback,
  Admin,
  Analytics,
  AdminNotification
} from '@/lib/models';

// Or import specific models
import { User, type IUser } from '@/lib/models/User';
```

---

## 🔧 Maintenance

- All models include automatic ID generation
- Timestamps are automatically managed
- Indexes optimize query performance
- Validation ensures data integrity
- TTL indexes auto-delete expired notifications

---

## 📝 Notes

1. **Order History**: The `orders` collection serves as order history. No separate collection needed.
2. **Menu Management**: Use the `menuitems` collection with admin CRUD operations.
3. **Feedback Reports**: The `feedbacks` collection stores all user feedback and can be queried by admins.
4. **User Roles**: Users can have roles: user, customer, admin, or staff.
5. **Real-time Updates**: All collections support real-time queries via change streams.

---

## 🎯 Best Practices

1. Always use indexes for frequently queried fields
2. Use refs for relationships between collections
3. Validate all inputs before saving
4. Use transactions for multi-document operations
5. Monitor index performance regularly
6. Clean up expired notifications automatically
7. Archive old orders/analytics periodically

---

## 📚 Collections Summary

| Collection | Purpose | Key Features |
|------------|---------|--------------|
| users | User accounts | Wallet, profile, roles |
| menuitems | Food catalog | Rating, nutrition, stock |
| favorites | User favorites | Quick reorder |
| transactions | Payments | Refunds, receipts |
| notifications | User alerts | TTL, deep links |
| orders | Order tracking | Real-time status |
| feedbacks | Reviews | Public/private, admin replies |
| admins | Staff accounts | Permissions, security |
| analytics | Business insights | Daily aggregation |
| adminnotifications | Broadcasts | Scheduled, targeted |

**Total: 10 Collections** - All production-ready! 🎉

