# System Diagram - Notifications Architecture

## Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                        CANTEEN BUDDY NOTIFICATIONS SYSTEM                  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          FRONTEND LAYER                              │  │
│  │                                                                      │  │
│  │  Admin Interface              Customer Interface                    │  │
│  │  /admin/notifications         /customer/notifications              │  │
│  │  ┌─────────────────────────┐  ┌──────────────────────────────────┐ │  │
│  │  │ Compose Notification    │  │ Notifications List               │ │  │
│  │  │ • Title                 │  │ • Filters (All/Order/Offer)      │ │  │
│  │  │ • Message               │  │ • Mark as read                   │ │  │
│  │  │ • Type                  │  │ • Delete                         │ │  │
│  │  │ • Priority              │  │ • Real-time updates via WS       │ │  │
│  │  │ • Icon                  │  │                                  │ │  │
│  │  │ • Select Customer/      │  │ 24/7 Socket.IO Connection       │ │  │
│  │  │   Broadcast             │  │                                  │ │  │
│  │  └────────────┬────────────┘  └────────────┬─────────────────────┘ │  │
│  │               │                            │                        │  │
│  └───────────────┼────────────────────────────┼────────────────────────┘  │
│                  │                            │                            │
│                  │ WebSocket Connection       │ WebSocket Connection       │
│                  │ (Socket.IO Client)         │ (Socket.IO Client)         │
│                  ▼                            ▼                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      WEBSOCKET LAYER                                │  │
│  │                                                                      │  │
│  │              Socket.IO Server                                       │  │
│  │              /api/socket/io                                         │  │
│  │                                                                      │  │
│  │  Admin Room          Customer Rooms                                 │  │
│  │  ┌──────────┐        ┌─────────────────────────────────────────┐  │  │
│  │  │ broadcast│        │ customer-{userId-1}                     │  │  │
│  │  │ channel  │        │ customer-{userId-2}                     │  │  │
│  │  └──────────┘        │ customer-{userId-N}                     │  │  │
│  │                      │                                         │  │  │
│  │  Events              │ Receives:                               │  │  │
│  │  • new_notification  │ • new_notification                      │  │  │
│  │  • notification_*    │ • notification_updated                  │  │  │
│  │                      │ • notification_deleted                  │  │  │
│  │                      └─────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                  │                            │                            │
│                  │ HTTP (REST API)            │ HTTP (REST API)            │
│                  ▼                            ▼                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      API LAYER                                      │  │
│  │                                                                      │  │
│  │  Admin API              Customer API                                │  │
│  │  ┌─────────────────┐    ┌──────────────────────────────────────┐  │  │
│  │  │ POST            │    │ GET                                  │  │  │
│  │  │ /api/admin/     │    │ /api/customer/notifications          │  │  │
│  │  │ notifications/  │    │ ?page=1&limit=50                     │  │  │
│  │  │ send (single)   │    │                                      │  │  │
│  │  │                 │    │ PATCH                                │  │  │
│  │  │ PUT             │    │ /api/customer/notifications/{id}     │  │  │
│  │  │ /api/admin/     │    │ Mark as read                         │  │  │
│  │  │ notifications/  │    │                                      │  │  │
│  │  │ send (broadcast)│    │ DELETE                               │  │  │
│  │  │                 │    │ /api/customer/notifications/{id}     │  │  │
│  │  └────────┬────────┘    │ Delete notification                  │  │  │
│  │           │             │                                      │  │  │
│  │  Validates:             │ POST                                 │  │  │
│  │  • Admin role ✓         │ /api/customer/notifications/         │  │  │
│  │  • User auth ✓          │ mark-all-read                        │  │  │
│  │                         │ Mark all as read                     │  │  │
│  │                         └────────┬─────────────────────────────┘  │  │
│  │                                  │                                │  │
│  └──────────────────────────────────┼────────────────────────────────┘  │
│                                     │                                     │
│                                     │ Database Operations                 │
│                                     ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      DATABASE LAYER                                │  │
│  │                                                                    │  │
│  │  MongoDB Collections                                              │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ notifications                                              │ │  │
│  │  │ ┌──────────────────────────────────────────────────────┐  │ │  │
│  │  │ │ _id: ObjectId                                        │  │ │  │
│  │  │ │ userId: ObjectId (indexed)                          │  │ │  │
│  │  │ │ title: String                                        │  │ │  │
│  │  │ │ message: String                                      │  │ │  │
│  │  │ │ type: String (order|offer|feedback|system)          │  │ │  │
│  │  │ │ priority: String (low|normal|high)                  │  │ │  │
│  │  │ │ isRead: Boolean (indexed)                            │  │ │  │
│  │  │ │ icon: String                                         │  │ │  │
│  │  │ │ ctaLink: String (optional)                           │  │ │  │
│  │  │ │ data: Object (optional)                              │  │ │  │
│  │  │ │ sentBy: ObjectId (admin reference)                  │  │ │  │
│  │  │ │ createdAt: Date                                      │  │ │  │
│  │  │ │ updatedAt: Date                                      │  │ │  │
│  │  │ └──────────────────────────────────────────────────────┘  │ │  │
│  │  │                                                             │ │  │
│  │  │ Indexes:                                                   │ │  │
│  │  │ • { userId: 1, createdAt: -1 }                           │ │  │
│  │  │ • { userId: 1, isRead: 1 }                               │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow Diagram

### Admin Sends Notification

```
Admin User
    │
    │ 1. Fills form
    │    • Title, message, type, priority, icon
    │    • Select customer or broadcast
    │
    ▼
Browser UI (/admin/notifications)
    │
    │ 2. onClick handler
    │    • Validates form
    │    • Shows loading state
    │
    ▼
HTTP POST/PUT
    │ /api/admin/notifications/send
    │ Headers: { Cookie: auth_token=... }
    │ Body: { title, message, type, ... }
    │
    ▼
API Route Handler
    │
    │ 3. Verify auth
    │    • Extract & verify JWT token
    │    • Check user is admin/canteen_staff
    │    • Return 401 if unauthorized
    │
    ▼
    │ 4. Validate input
    │    • Check required fields
    │    • Validate ObjectIds
    │
    ▼
    │ 5. Database operation
    │    • Save notification to MongoDB
    │    • Document stored with userId
    │
    ▼
    │ 6. WebSocket emission
    │    • Get Socket.IO instance
    │    • Emit to customer room(s)
    │    │ if (broadcast)
    │    │   io.to('all-customers').emit(...)
    │    │ else
    │    │   io.to(`customer-${userId}`).emit(...)
    │
    ▼
HTTP 201 Response
    │ { data: notification, message: "Sent successfully" }
    │
    ▼
Admin Browser
    │
    │ 7. Handle response
    │    • Show success toast
    │    • Add to recent list
    │    • Clear form
    │
    ▼
Admin Sees Success ✓
    │
    └─────────────────────────────────────────┐
                                              │
                                    (Meanwhile...)
                                              │
Customer Browser                              │
    ▼                                         │
WebSocket Listener                            │
    │ Receives: new_notification event        │
    │ Data: { id, title, message, ... }       │
    │                                         │
    ├─ Listener activated                     │
    │                                         │
    ├─ State update                           │
    │  setNotifications([new_notif, ...])    │
    │                                         │
    ├─ UI re-render                           │
    │                                         │
    ├─ Toast notification                     │
    │  "Order Ready" notification appears      │
    │                                         │
    ▼                                         │
Customer Sees Notification ✓                 │
(NO MANUAL REFRESH NEEDED)                   │
    │                                         │
    └─────────────────────────────────────────┘
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│               CUSTOMER NOTIFICATIONS PAGE STATE                  │
│                                                                  │
│  State Variables:                                               │
│  • notifications: Notification[]      (from DB + WS updates)   │
│  • activeTab: string                  (filter: all/order/etc)  │
│  • isLoading: boolean                 (fetch in progress)      │
│  • socket: Socket                     (WebSocket connection)   │
│  • isConnected: boolean                (WS connection status)   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  INITIALIZATION PHASE (On Mount)                           │ │
│  │                                                             │ │
│  │  useEffect(() => {                                         │ │
│  │    setIsLoading(true)                                      │ │
│  │    fetchNotifications()  ──► GET /api/customer/...        │ │
│  │  }, [])                                                    │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │  WEBSOCKET PHASE (On Connection)                           │ │
│  │                                                             │ │
│  │  useEffect(() => {                                         │ │
│  │    socket.on('new_notification', handleNewNotification)   │ │
│  │    socket.on('notification_updated', handleUpdate)        │ │
│  │    socket.on('notification_deleted', handleDelete)        │ │
│  │  }, [socket, isConnected])                                │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │  USER INTERACTION PHASE (Mark/Delete)                      │ │
│  │                                                             │ │
│  │  1. Optimistic Update                                      │ │
│  │     setNotifications(update state immediately)            │ │
│  │                                                             │ │
│  │  2. API Call (async)                                       │ │
│  │     PATCH/DELETE /api/customer/notifications/...          │ │
│  │                                                             │ │
│  │  3. Error Handling                                         │ │
│  │     if (!response.ok) revert state                         │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │  RENDER PHASE                                              │ │
│  │                                                             │ │
│  │  filteredNotifications = filter by activeTab              │ │
│  │                                                             │ │
│  │  return (                                                  │ │
│  │    <Tabs>                                                  │ │
│  │      {isLoading && <Skeleton />}                           │ │
│  │      {filteredNotifications.map(n => <NotifCard />)}     │ │
│  │    </Tabs>                                                 │ │
│  │  )                                                         │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
Error Scenario
    │
    ├─ Network Error (fetch fails)
    │  │ catch block triggered
    │  │ setIsLoading(false)
    │  │ toast.error("Failed to load...")
    │  │ Page shows error state
    │  │
    │  └─ Recovery: User can retry
    │
    ├─ 401 Unauthorized (not authenticated)
    │  │ Response: { error: "Unauthorized" }
    │  │ toast.error("Unauthorized")
    │  │ Could redirect to login
    │  │
    │  └─ Recovery: Redirect to auth
    │
    ├─ 403 Forbidden (not authorized)
    │  │ Admin sending without role
    │  │ Response: { error: "Unauthorized - Admin access required" }
    │  │ toast.error("Not authorized")
    │  │
    │  └─ Recovery: Show error message
    │
    ├─ 404 Not Found (notification doesn't exist)
    │  │ DELETE/PATCH on non-existent notification
    │  │ Response: { error: "Notification not found" }
    │  │ toast.error("Not found")
    │  │
    │  └─ Recovery: Refresh list
    │
    ├─ 500 Server Error (database/server issue)
    │  │ try/catch catches error
    │  │ console.error logs details
    │  │ toast.error("Failed to...")
    │  │
    │  └─ Recovery: Retry or refresh page
    │
    ├─ WebSocket Disconnected
    │  │ socket.on('disconnect')
    │  │ isConnected = false
    │  │ Event listeners disabled
    │  │ New notifications won't arrive in real-time
    │  │ But API calls still work
    │  │
    │  └─ Recovery: Auto-reconnect or manual refresh
    │
    └─ Invalid Data Format
       │ Notification missing required fields
       │ Handled in response transformation
       │ Default values provided
       │ UI renders partial data
       │
       └─ Recovery: Will work once data is correct
```

---

## Sequence Diagram - Full Notification Flow

```
Admin                    Backend API              MongoDB         Customer        WebSocket
  │                         │                        │               │               │
  │ 1. POST notification    │                        │               │               │
  ├────────────────────────►│                        │               │               │
  │                         │                        │               │               │
  │                         │ 2. Validate JWT       │               │               │
  │                         │ (admin check)         │               │               │
  │                         │                        │               │               │
  │                         │ 3. Save document      │               │               │
  │                         ├───────────────────────►│               │               │
  │                         │                        │ (inserted)    │               │
  │                         │◄───────────────────────┤               │               │
  │                         │ (_id returned)         │               │               │
  │                         │                        │               │               │
  │                         │ 4. getIO() get socket │               │               │
  │                         │    instance            │               │               │
  │                         │                        │               │               │
  │                         │ 5. Emit new_notification             │
  │                         │                        │               │               │
  │                         │                        │               │ 6. Listen    │
  │◄────201 OK──────────────┤                        │               │◄──────────────┤
  │                         │                        │               │               │
  │ Show success toast      │                        │               │ 7. Handler   │
  │                         │                        │               │    trigger   │
  │                         │                        │               │               │
  │                         │                        │               │ 8. setState  │
  │                         │                        │               │    prepend   │
  │                         │                        │               │               │
  │                         │                        │               │ 9. Toast    │
  │                         │                        │               │    "New!"    │
  │                         │                        │               │               │
  │                         │                        │               │ 10. Render   │
  │                         │                        │               │     UI       │
  │                         │                        │               │               │
  ▼                         ▼                        ▼               ▼               ▼
```

---

## Data Structure Flow

```
Admin Form Data
    │
    │ {
    │   title: "Order Ready",
    │   message: "Order #123 ready for pickup",
    │   type: "order",
    │   priority: "high",
    │   icon: "bell",
    │   userId: "507f1f77bcf86cd799439011",
    │   ctaLink: "/customer/orders/123"
    │ }
    │
    ▼
API Endpoint
    │ Validates & enriches
    │
    ▼
MongoDB Document
    │
    │ {
    │   _id: ObjectId("..."),
    │   userId: ObjectId("507f1f77bcf86cd799439011"),
    │   title: "Order Ready",
    │   message: "Order #123 ready for pickup",
    │   type: "order",
    │   priority: "high",
    │   icon: "bell",
    │   ctaLink: "/customer/orders/123",
    │   isRead: false,
    │   sentBy: ObjectId("admin_id"),
    │   data: {},
    │   createdAt: ISODate("2024-01-01T12:00:00Z"),
    │   updatedAt: ISODate("2024-01-01T12:00:00Z")
    │ }
    │
    ▼
WebSocket Event
    │
    │ {
    │   id: "507f...",
    │   userId: "507f...",
    │   title: "Order Ready",
    │   message: "Order #123 ready for pickup",
    │   type: "order",
    │   priority: "high",
    │   icon: "bell",
    │   isRead: false,
    │   timestamp: Date,
    │   ctaLink: "/customer/orders/123"
    │ }
    │
    ▼
Client State
    │
    │ {
    │   id: "507f...",
    │   userId: "507f...",
    │   type: "order",
    │   title: "Order Ready",
    │   message: "Order #123 ready for pickup",
    │   isRead: false,
    │   timestamp: Date("..."),
    │   ctaLink: "/customer/orders/123",
    │   priority: "high",
    │   icon: "bell",
    │   data: {}
    │ }
    │
    ▼
UI Rendering
    │
    └─► NotificationCard Component
        • Title: "Order Ready"
        • Message: "Order #123 ready for pickup"
        • Type badge: "order"
        • Priority color: Red (high)
        • Icon: 🔔
        • Timestamp: "12:00 PM"
        • Actions: Mark read, Delete
        • CTA Link: "/customer/orders/123"
```

---

**Diagrams created to visualize the real-time notifications system architecture and data flows.**
