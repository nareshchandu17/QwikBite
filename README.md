<div align="center">

# 🍽️ qwikBite

### **Smart Canteen Management System — Reimagined**

> A production-grade, real-time canteen management platform built with Next.js 15, MongoDB, Socket.IO, and Stripe. Designed for scale, shipped with engineering excellence.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

---

[**Live Demo**](#) · [**Report Bug**](../../issues) · [**Request Feature**](../../issues) · [**Documentation**](./docs/)

---

<!-- Screenshots Placeholder -->
<img src="https://placehold.co/1200x600/1a1a2e/e94560?text=qwikBite+%E2%80%94+Dashboard+Preview&font=Inter" alt="qwikBite Dashboard" width="90%" />

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture Overview](#-architecture-overview)
- [Core Systems Deep Dive](#-core-systems-deep-dive)
- [Tech Stack](#-tech-stack)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Performance & Optimization](#-performance--optimization)
- [Screenshots](#-screenshots)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🧠 Smart Systems

| Feature | Description |
|---------|-------------|
| **Dynamic Slot Engine** | Capacity-based time slot booking with real-time fill tracking (Open → Busy → Full) |
| **Real-Time WebSocket Layer** | Live order tracking, transaction feeds, and notification push via Socket.IO |
| **Intelligent Notifications** | Room-based targeted & broadcast notifications with priority levels |
| **Order Lifecycle Tracking** | Complete order state machine: Placed → Preparing → Ready → Collected |

### 💳 Payments & Transactions

| Feature | Description |
|---------|-------------|
| **Stripe Integration** | Secure payment processing with Payment Intents API |
| **Transaction Ledger** | Auto-generated unique `TXN-{timestamp}-{hash}` IDs for every transaction |
| **Multi-Method Support** | UPI, Card, and Cash payment methods with status tracking |
| **Real-Time Receipts** | Instant transaction broadcast to admin dashboard via WebSocket |

### 🛠 Admin Controls

| Feature | Description |
|---------|-------------|
| **Analytics Dashboard** | Revenue tracking, order volume, slot utilization, and performance metrics |
| **Menu Management** | Full CRUD with categories, tags, pricing, and image management |
| **Staff Management** | Role-based staff accounts with activity logging |
| **Order Queue** | Live order management with status updates and time tracking |
| **Inventory Tracking** | Real-time stock monitoring with low-stock alerts |
| **Feedback System** | Customer feedback collection with AI-powered classification |

### 🔐 Security

| Feature | Description |
|---------|-------------|
| **JWT + RBAC** | Role-based access control with HttpOnly secure cookies |
| **Bcrypt Hashing** | 12-round password hashing with timing-safe comparison |
| **Route Protection** | Server-side middleware + client-side guards for admin/customer separation |
| **Input Validation** | Zod schema validation on all API endpoints |
| **Audit Logging** | Comprehensive audit trail for all admin operations |

### ⚡ Performance

| Feature | Description |
|---------|-------------|
| **Optimized Queries** | Compound MongoDB indexes on hot paths (`timeSlot`, `status`, `createdAt`) |
| **Selective Field Projection** | `.select()` on queries to minimize data transfer |
| **Connection Pooling** | Singleton MongoDB connection manager with retry logic |
| **Graceful Shutdown** | Coordinated HTTP + WebSocket shutdown with 10s timeout |

---

## 🏗 Architecture Overview

qwikBite uses a **unified full-stack architecture** — a single Next.js server handles HTTP requests, API routes, and WebSocket connections, eliminating the need for separate backend services.

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                  │
│   Customer App (/customer/*)     Admin Dashboard (/admin/*)     │
│   • Browse Menu                  • Analytics & Reports          │
│   • Select Time Slots            • Order Queue Management       │
│   • Stripe Checkout              • Menu CRUD Operations         │
│   • Order Tracking               • Slot Monitoring              │
│   • Real-Time Notifications      • Staff Management             │
│                                                                  │
└──────────────┬─────────────────────────────┬─────────────────────┘
               │                             │
               │  HTTP (REST)                │  WebSocket (Socket.IO)
               ▼                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    UNIFIED SERVER LAYER                           │
│                                                                  │
│   Next.js 15 App Router                                         │
│   ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│   │   API Routes (/api/*)   │  │   Socket.IO Server          │  │
│   │   • /api/menu           │  │   • Room-based routing      │  │
│   │   • /api/orders         │  │   • Event broadcasting      │  │
│   │   • /api/slots          │  │   • Connection management   │  │
│   │   • /api/transactions   │  │   • Graceful reconnection   │  │
│   │   • /api/auth           │  │                             │  │
│   │   • /api/notifications  │  │   Path: /api/socket/io      │  │
│   └─────────────┬───────────┘  └──────────────┬──────────────┘  │
│                 │                              │                  │
│   ┌─────────────▼──────────────────────────────▼──────────────┐  │
│   │              Middleware Layer                              │  │
│   │   • JWT Verification    • RBAC Enforcement               │  │
│   │   • Request Validation  • Rate Limiting                  │  │
│   └─────────────┬────────────────────────────────────────────┘  │
└─────────────────┼────────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│                                                                  │
│   MongoDB Atlas (Mongoose ODM)                                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│   │  Orders   │ │   Menu   │ │  Slots   │ │  Transactions    │  │
│   │  Users    │ │ Feedback │ │  Staff   │ │  Notifications   │  │
│   │  Admins   │ │ Analytics│ │ AuditLog │ │  EventLog        │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│                                                                  │
│   Indexes: compound, unique, TTL  │  Encryption at rest         │
└──────────────────────────────────────────────────────────────────┘
```

**Why this architecture?**
- **Single deployment unit** — one server, one port, one process
- **Shared HTTP server** for REST and WebSocket — no CORS headaches
- **No cold start penalty** — WebSocket server boots with the app
- **Simplified DevOps** — one Dockerfile, one health check, one log stream

---

## 🔄 Core Systems Deep Dive

### 1. Dynamic Slot Management

The slot engine calculates real-time capacity based on **live order data**, not static configuration.

```
Customer places order → selects "08:30 - 09:00"
    │
    ▼
POST /api/orders { timeSlot: "08:30 - 09:00" }
    │
    ▼
Order saved to MongoDB with timeSlot field
    │
    ▼
WebSocket broadcasts → Admin dashboard triggers GET /api/slots
    │
    ▼
API counts active orders per slot (excludes cancelled/collected)
    │
    ▼
Fill % = (orderCount / 20) × 100
    │
    ├─ 0-49%  → 🟢 Open    → "Fast Delivery"
    ├─ 50-84% → 🟡 Busy    → "Slight Delay"
    └─ 85%+   → 🔴 Full    → "Next Slot Recommended"
```

- **16 time slots** × 30 min intervals across the day
- **Max capacity**: 20 orders per slot
- **Auto-disables** full slots in the customer UI
- **Compound index** `{ timeSlot: 1, createdAt: -1 }` for fast date+slot queries

---

### 2. Real-Time WebSocket System

Socket.IO powers all real-time features through a **room-based event architecture**.

| Event | Trigger | Payload | Receivers |
|-------|---------|---------|-----------|
| `new_order` | Customer places order | Order object | Admin room |
| `order_update` | Admin updates status | `{ orderId, status }` | Customer room |
| `new_transaction` | Payment processed | Transaction object | Admin room |
| `new_notification` | Admin sends alert | Notification object | Target customer room |
| `slot_update` | Capacity changes | Slot status array | All connected clients |

**Connection lifecycle:**
- Client connects → joins `customer-{userId}` or `admin` room
- Auto-reconnection with exponential backoff
- Graceful disconnect handling on server shutdown

---

### 3. Transaction System

Every payment generates a **unique, traceable transaction record** with an auto-generated ID.

```
TXN-1734672341234-A7B2C9D → Unique transaction ID
ORD-1734672341234-5432    → Linked order reference
```

- **Pre-save middleware** generates `TXN-{timestamp}-{random}` IDs
- **6 indexed fields** for optimized queries (transactionId, orderId, status, method, customer, createdAt)
- **Three payment methods**: UPI, Card, Cash
- **Three status states**: Success, Pending, Failed
- **WebSocket broadcast** to admin on every new transaction

---

### 4. Menu Management System

Fully API-driven menu with **category grouping, tag filtering, and real-time availability**.

- **Dynamic categories** with custom ordering
- **Tag-based filtering** (Veg, Non-Veg, Popular, New)
- **Price management** with optional discount pricing
- **Image upload** support for menu item visuals
- **Availability toggle** — hide items without deleting

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15.5 (App Router) | Full-stack framework with API routes |
| **Frontend** | React 19, TypeScript 5.6 | UI with type safety |
| **Styling** | Tailwind CSS 4.x, Radix UI | Utility-first CSS + accessible primitives |
| **Animations** | Framer Motion, GSAP | Smooth transitions and micro-animations |
| **State** | Zustand | Lightweight global state management |
| **Forms** | React Hook Form + Zod | Performant forms with schema validation |
| **Database** | MongoDB Atlas + Mongoose | Document database with ODM |
| **Auth** | JWT (jose) + bcryptjs | Stateless authentication with password hashing |
| **Real-Time** | Socket.IO 4.8 | WebSocket server with room-based routing |
| **Payments** | Stripe (react-stripe-js) | PCI-compliant payment processing |
| **Charts** | Recharts, Chart.js | Analytics visualization |
| **Email** | Nodemailer, SendGrid | Transactional email delivery |
| **QR** | qrcode.react | QR code generation for orders |
| **Testing** | Vitest, Testing Library | Unit and component testing |

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** ≥ 18.x
- **MongoDB** Atlas cluster or local instance
- **Stripe** account (for payments)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/qwikbite.git
cd qwikbite

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)

# 4. Initialize database with seed data
npm run init:db
npm run seed:menu

# 5. Start development server
npm run dev:safe
```

The app will be running at **http://localhost:3000**

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:safe` | Start Next.js dev server on port 3000 |
| `npm run dev:server` | Start with WebSocket server integration |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run test suite with Vitest |
| `npm run seed:menu` | Seed database with sample menu items |
| `npm run init:db` | Initialize database collections and indexes |

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `MONGODB_DB` | ✅ | Database name (default: `qwikbite`) |
| `JWT_SECRET` | ✅ | Secret key for JWT signing (use a strong random value) |
| `NEXTAUTH_URL` | ✅ | Application URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | ✅ | NextAuth.js secret key |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Public-facing base URL |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret API key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key |
| `OPENROUTER_API_KEY` | ⬜ | API key for AI-powered features |

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/qwikbite
MONGODB_DB=qwikbite

# Authentication
JWT_SECRET=your-strong-random-secret-min-32-chars
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

> ⚠️ **Never commit `.env` to version control.** The `.gitignore` already excludes it.

---

## 📡 API Overview

All endpoints are served under `/api/*` via Next.js App Router.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register a new customer or admin account |
| `POST` | `/api/auth/signin` | Authenticate and receive JWT token |
| `POST` | `/api/auth/signout` | Invalidate session and clear cookie |

### Menu

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/menu` | Fetch all menu items with categories |
| `POST` | `/api/menu` | Create a new menu item *(Admin)* |
| `PUT` | `/api/menu/:id` | Update an existing menu item *(Admin)* |
| `DELETE` | `/api/menu/:id` | Remove a menu item *(Admin)* |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | Fetch orders (filtered by user role) |
| `POST` | `/api/orders` | Place a new order with time slot |
| `PATCH` | `/api/orders/:id` | Update order status *(Admin)* |

### Slots

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/slots` | Fetch all 16 time slots with live capacity |
| `GET` | `/api/timeslots` | Alternate slot endpoint with availability |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transactions` | Fetch all transactions (sorted by date) |
| `POST` | `/api/transactions` | Record a new payment transaction |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/customer/notifications` | Fetch customer notifications |
| `POST` | `/api/admin/notifications/send` | Send notification *(Admin)* |
| `PATCH` | `/api/customer/notifications/:id` | Mark as read |
| `DELETE` | `/api/customer/notifications/:id` | Delete notification |

### Additional Endpoints

| Area | Endpoints |
|------|-----------|
| **Favorites** | `/api/favorites` — CRUD for saved menu items |
| **Feedback** | `/api/feedbacks` — Customer reviews and ratings |
| **Staff** | `/api/staff`, `/api/staffmanagement` — Staff CRUD *(Admin)* |
| **Inventory** | `/api/inventory` — Stock management *(Admin)* |
| **Analytics** | `/api/dashboard` — Aggregated metrics *(Admin)* |
| **Payments** | `/api/payment/create-intent` — Stripe PaymentIntent creation |
| **Health** | `/api/health` — Server health check |

---

## 📊 Performance & Optimization

### Database Indexing Strategy

```javascript
// Transaction indexes — sub-100ms queries at scale
{ transactionId: 1 }           // Unique lookups
{ orderId: 1 }                 // Order-transaction linking
{ status: 1 }                  // Status filtering
{ method: 1 }                  // Payment method filtering
{ createdAt: -1 }              // Chronological sorting

// Order indexes — optimized for slot calculations
{ timeSlot: 1, createdAt: -1 } // Compound: slot + date range
{ status: 1 }                  // Active order filtering

// Notification indexes
{ userId: 1, createdAt: -1 }   // Per-user chronological feed
{ userId: 1, isRead: 1 }       // Unread count queries
```

### Performance Benchmarks

| Operation | Target Latency | Optimization |
|-----------|---------------|--------------|
| Create Transaction | < 100ms | Pre-save middleware, indexed writes |
| Fetch Transactions | < 200ms | Compound indexes, field projection |
| Slot Capacity Query | < 150ms | Composite index, in-memory grouping |
| WebSocket Broadcast | < 50ms | Room-based emission, no DB round-trip |
| Menu Fetch (full) | < 300ms | Lean queries, populated categories |

### Additional Optimizations

- **Selective field projection** — `.select('timeSlot status')` on slot queries
- **Lean queries** — `.lean()` for read-only operations (skip Mongoose hydration)
- **Connection pooling** — Singleton MongoDB client with automatic retry
- **Optimistic UI updates** — Client-side state updates before API confirmation
- **Graceful degradation** — WebSocket failures don't break REST functionality

---

## 📸 Screenshots

<div align="center">

### Admin Dashboard
<img src="https://placehold.co/1000x550/0f0f23/6C63FF?text=Admin+Dashboard+%E2%80%94+Analytics+%26+Metrics&font=Inter" alt="Admin Dashboard" width="85%" />

### Slot Management System
<img src="https://placehold.co/1000x550/0f0f23/00D9A5?text=Dynamic+Slot+Engine+%E2%80%94+Real-Time+Capacity&font=Inter" alt="Slot Management" width="85%" />

### Payment Flow
<img src="https://placehold.co/1000x550/0f0f23/FF6B6B?text=Stripe+Checkout+%E2%80%94+Secure+Payments&font=Inter" alt="Payment Flow" width="85%" />

### Customer Menu
<img src="https://placehold.co/1000x550/0f0f23/FFD93D?text=Menu+Browser+%E2%80%94+Categories+%26+Filters&font=Inter" alt="Customer Menu" width="85%" />

### Real-Time Order Tracking
<img src="https://placehold.co/1000x550/0f0f23/4ECDC4?text=Live+Order+Tracking+%E2%80%94+WebSocket+Updates&font=Inter" alt="Order Tracking" width="85%" />

</div>

---

## 🚀 Future Improvements

| Priority | Feature | Impact |
|----------|---------|--------|
| 🔴 High | **Redis caching layer** — Cache hot queries (menu, slots) with TTL | 3x read performance |
| 🔴 High | **Push notifications** — Web Push API for order-ready alerts | Improved engagement |
| 🟡 Medium | **Multi-tenant support** — Multiple canteens under one instance | Enterprise readiness |
| 🟡 Medium | **Rate limiting** — Express rate limiter on API routes | DDoS protection |
| 🟡 Medium | **Message queue** — Redis Pub/Sub for WebSocket reliability | Zero message loss |
| 🟢 Low | **PWA support** — Service worker for offline menu browsing | Mobile experience |
| 🟢 Low | **Horizontal scaling** — Socket.IO Redis adapter for clustering | Unlimited concurrency |
| 🟢 Low | **CI/CD pipeline** — GitHub Actions with automated testing | Deployment velocity |

---

## 📁 Project Structure

```
qwikBite/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── admin/               # Admin dashboard pages
│   │   │   ├── analytics/       # Revenue & performance charts
│   │   │   ├── dashboard/       # Main admin overview
│   │   │   ├── menu/            # Menu CRUD interface
│   │   │   ├── orders/          # Order queue management
│   │   │   ├── payments/        # Transaction ledger
│   │   │   ├── slots/           # Slot capacity monitor
│   │   │   ├── staff/           # Staff management
│   │   │   └── notifications/   # Notification composer
│   │   ├── customer/            # Customer-facing pages
│   │   │   ├── menu/            # Menu browser
│   │   │   ├── orders/          # Order history
│   │   │   ├── payment/         # Stripe checkout
│   │   │   ├── slot-selection/  # Time slot picker
│   │   │   └── notifications/   # Notification center
│   │   ├── api/                 # REST API endpoints
│   │   │   ├── auth/            # Authentication
│   │   │   ├── menu/            # Menu CRUD
│   │   │   ├── orders/          # Order management
│   │   │   ├── slots/           # Slot capacity
│   │   │   ├── transactions/    # Payment records
│   │   │   └── socket/          # WebSocket HTTP bridge
│   │   └── auth/                # Auth pages (signin/signup)
│   ├── components/              # Reusable UI components
│   │   ├── admin/               # Admin-specific components
│   │   ├── customer/            # Customer-specific components
│   │   ├── ui/                  # Radix UI primitives
│   │   └── home/                # Landing page components
│   ├── models/                  # Mongoose schemas
│   ├── stores/                  # Zustand state stores
│   ├── types/                   # TypeScript type definitions
│   ├── lib/                     # Utilities & helpers
│   ├── hooks/                   # Custom React hooks
│   ├── context/                 # React context providers
│   └── server/                  # WebSocket server
│       ├── websocket/           # Socket.IO implementation
│       └── db/                  # MongoDB service
├── docs/                        # Technical documentation
│   ├── architecture/            # System diagrams
│   ├── implementation/          # Feature implementation guides
│   ├── security/                # Security documentation
│   └── system-design/           # Server & infra design
├── public/                      # Static assets
├── server.js                    # Custom server entry point
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
└── package.json                 # Dependencies & scripts
```

---

## 🤝 Contributing

Contributions are what make the open-source community great. Any contribution you make is **greatly appreciated**.

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Guidelines

- Follow the existing code style and TypeScript conventions
- Write meaningful commit messages using [Conventional Commits](https://www.conventionalcommits.org/)
- Add tests for new features when applicable
- Update documentation for API changes
- Ensure `npm run typecheck` and `npm run lint` pass before submitting

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

<div align="center">

### Built with 💜 by the qwikBite Team

**If this project helped you, consider giving it a ⭐**

[⬆ Back to Top](#-qwikbite)

</div>
