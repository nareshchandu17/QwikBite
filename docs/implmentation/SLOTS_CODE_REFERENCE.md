# Code Reference - Dynamic Slots Implementation

## 1. Slot Calculation Utilities

**File:** `src/lib/slotCalculations.ts`

```typescript
/**
 * Dynamic Time Slot Calculation Utilities
 * 
 * These utilities handle:
 * - Fill percentage calculation
 * - Status determination based on capacity
 * - User-friendly status messages
 * - Color styling for visual indicators
 */

// Maximum orders per 30-minute slot
export const MAX_ORDERS_PER_SLOT = 20;

/**
 * Calculate fill percentage based on order count
 * @param orderCount - Number of orders in slot
 * @param maxCapacity - Maximum capacity (default 20)
 * @returns Percentage filled (0-100)
 */
export const calculateFillPercentage = (orderCount: number, maxCapacity: number = MAX_ORDERS_PER_SLOT): number => {
  if (maxCapacity <= 0) return 0;
  return Math.min(Math.round((orderCount / maxCapacity) * 100), 100);
};

/**
 * Determine slot status from fill percentage
 * @param fill - Fill percentage (0-100)
 * @returns Status: 'Open' | 'Busy' | 'Full'
 */
export const getSlotStatus = (fill: number): 'Open' | 'Busy' | 'Full' => {
  if (fill < 50) return 'Open';    // 0-49%
  if (fill < 85) return 'Busy';    // 50-84%
  return 'Full';                   // 85-100%
};

/**
 * Get user-friendly status message
 * @param status - Slot status
 * @returns Message with emoji
 */
export const getStatusMessage = (status: 'Open' | 'Busy' | 'Full'): string => {
  const messages: Record<string, string> = {
    'Open': '🟢 Fast Delivery',
    'Busy': '🟡 Slight Delay',
    'Full': '🔴 Next Slot Recommended'
  };
  return messages[status] || '🟢 Fast Delivery';
};

/**
 * Get color classes for styling
 * @param status - Slot status
 * @returns Object with bgColor, textColor, glowColor
 */
export const getSlotColorClasses = (status: 'Open' | 'Busy' | 'Full') => {
  const colors = {
    'Open': {
      bgColor: 'bg-gradient-to-br from-green-500/20 to-emerald-500/10',
      textColor: 'text-green-400',
      glowColor: 'shadow-lg shadow-green-500/30'
    },
    'Busy': {
      bgColor: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/10',
      textColor: 'text-yellow-400',
      glowColor: 'shadow-lg shadow-yellow-500/30'
    },
    'Full': {
      bgColor: 'bg-gradient-to-br from-red-500/20 to-pink-500/10',
      textColor: 'text-red-400',
      glowColor: 'shadow-lg shadow-red-500/30'
    }
  };
  return colors[status];
};
```

---

## 2. Slots API Endpoint

**File:** `src/app/api/slots/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { calculateFillPercentage, getSlotStatus, getStatusMessage } from '@/lib/slotCalculations';

const defaultTimeSlots = [
  { time: "08:30 - 09:00", maxCapacity: 20 },
  { time: "09:00 - 09:30", maxCapacity: 20 },
  // ... 14 more slots ...
  { time: "04:00 - 04:30", maxCapacity: 20 },
];

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get orders from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const ordersQuery = {
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    };
    
    // Get all orders with their selected slots
    const orders = await Order.find(ordersQuery).select('timeSlot status');
    
    // Calculate order count per slot
    const slotOrderCount: { [key: string]: number } = {};
    
    defaultTimeSlots.forEach(slot => {
      // Count non-collected/non-cancelled orders in this slot
      const count = orders.filter(
        order => order.timeSlot === slot.time && 
                 order.status !== 'collected' && 
                 order.status !== 'cancelled'
      ).length;
      slotOrderCount[slot.time] = count;
    });
    
    // Build response with calculated fill and status
    const slotsWithData = defaultTimeSlots.map(slot => {
      const orderCount = slotOrderCount[slot.time] || 0;
      const fill = calculateFillPercentage(orderCount, slot.maxCapacity);
      const status = getSlotStatus(fill);
      
      return {
        time: slot.time,
        fill,
        status,
        orderCount,
        maxCapacity: slot.maxCapacity,
        statusMessage: getStatusMessage(status)
      };
    });
    
    console.log('[Slots API] ✅ Fetched slots with dynamic fill:', slotsWithData);
    
    return NextResponse.json(slotsWithData, { status: 200 });
  } catch (error) {
    console.error('[Slots API] ❌ Error fetching slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slots' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Placeholder for future slot configuration
    const data = await req.json();
    console.log('[Slots API] POST received:', data);
    
    return NextResponse.json(
      { message: 'Slots are calculated dynamically from orders' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Slots API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

---

## 3. Order Creation with TimeSlot

**File:** `src/app/api/orders/route.ts` (Updated POST)

```typescript
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json().catch(() => ({}));
    const { items, total, timeSlot } = body;  // ← Extract timeSlot

    // Get auth token and verify user
    const token = getAuthCookie(req);
    if (!token) return jsonResponse({ error: 'Unauthorized' }, 401);

    const decoded = verifyToken(token);
    if (!decoded?.id) return jsonResponse({ error: 'Invalid token' }, 401);

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse({ error: 'Invalid items' }, 400);
    }

    const order = await Order.create({
      userId: decoded.id,
      items,
      total: Number(total || 0),
      timeSlot: timeSlot || 'Not specified',  // ← Save timeSlot
    });

    return jsonResponse(order, 201);
  } catch (err) {
    console.error('POST /api/orders error:', err);
    return jsonResponse({ error: 'Failed to create order' }, 500);
  }
}
```

---

## 4. Admin Slots Display Component

**File:** `src/components/admin/SlotsTimings.tsx` (Key Parts)

```typescript
const SlotsTimings: React.FC = () => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch slots from dynamic endpoint
  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/slots', { cache: 'no-store' });
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setSlots(data);
    } catch (error) {
      console.error('Failed to load slots:', error);
      toast.error('Failed to load time slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSlots();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Render slots grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {slots.map((slot) => {
        const colors = getSlotColorClasses(slot.status);
        const isDisabled = slot.status === 'Full';
        
        return (
          <div
            key={slot.time}
            className={`
              p-4 rounded-xl border transition-all duration-300
              ${colors.bgColor}
              border-white/10
              ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-white/20'}
              ${colors.glowColor}
            `}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-white">{slot.time}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${colors.textColor}`}>
                {slot.status}
              </span>
            </div>

            <div className="mb-3">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    slot.status === 'Open' ? 'bg-green-500' :
                    slot.status === 'Busy' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${slot.fill}%` }}
                />
              </div>
            </div>

            <p className={`text-sm font-semibold ${colors.textColor}`}>
              {slot.statusMessage}
            </p>
            
            <p className="text-xs text-gray-400 mt-1">
              {slot.orderCount}/{slot.maxCapacity} orders • {slot.fill}% full
            </p>

            {isDisabled && (
              <p className="text-xs text-red-400 font-semibold mt-2">
                ⚠️ Bookings closed
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

---

## 5. Order Summary (Slot Included)

**File:** `src/app/customer/order-summary/page.tsx` (Key Part)

```typescript
// When user clicks "Continue to Payment"
const handleProceedToPayment = () => {
  const orderData = {
    id: `ORD-${Date.now()}`,
    items: cart.map(item => ({
      id: item.item.id,
      name: item.item.name || 'Item',
      quantity: item.quantity,
      price: item.item.price || 0,
      image: item.item.image
    })),
    total: totals.total,
    subtotal: totals.subtotal,
    tax: totals.tax,
    timeSlot: timeSlot,  // ← Include selected slot
    status: 'pending'
  };
  
  console.log('✅ Saving orderData with timeSlot:', orderData);
  localStorage.setItem('orderData', JSON.stringify(orderData));
  
  router.push('/customer/payment');
};
```

---

## 6. Order Type Definition

**File:** `src/types/order.ts`

```typescript
export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  estimatedTime: number;
  pickupCounter: string;
  orderTime: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  statusHistory: OrderStatusUpdate[];
  chefMessage?: string;
  payment?: PaymentInfo;
  paymentMethod?: string;
  feedbackGiven?: boolean;
  deliveryPerson?: DeliveryPerson;
  customerName?: string;
  timeSlot?: string;  // ← Time slot selected (e.g., "08:30 - 09:00")
}
```

---

## 7. TimeSlot Type Definition

**File:** `src/types/slot.ts`

```typescript
export interface TimeSlot {
  id?: string;
  time: string;  // e.g., "08:30 - 09:00"
  status?: string;  // 'Open', 'Busy', 'Full'
  fill?: number;  // Percentage 0-100
  available?: boolean;
  orderCount?: number;  // Actual orders in slot
  maxCapacity?: number;  // Max orders (20)
  statusMessage?: string;  // User-friendly message
}
```

---

## 8. Order Model with TimeSlot

**File:** `src/lib/models/Order.ts`

```typescript
export interface IOrder extends Document {
  id: string;
  userId: string;
  createdAt: Date;
  items: IOrderItem[];
  total: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  status: 'received' | 'preparing' | 'almost_ready' | 'ready' | 'collected';
  timeSlot: string;  // ← Added field
  feedbackGiven?: boolean;
  rating?: number;
  comment?: string;
  paymentIntentId?: string;
  transactionId?: string;
}

const orderSchema = new Schema<IOrder>({
  // ... other fields ...
  timeSlot: { type: String, required: true },  // ← Added
  // ... other fields ...
});

// Add indexes
orderSchema.index({ timeSlot: 1 });  // ← Fast slot lookups
orderSchema.index({ timeSlot: 1, createdAt: -1 });  // ← Slot + date
```

---

## Data Flow Diagram

```
Customer Checkout
        ↓
Select Slot
 (cartStore.setTimeSlot)
        ↓
Order Summary
 (orderData.timeSlot = slot)
        ↓
Payment (localStorage)
 (orderData.timeSlot included)
        ↓
POST /api/orders
 { items, total, timeSlot }
        ↓
Order.create()
 (saves with timeSlot)
        ↓
Admin Dashboard
 GET /api/slots
 (counts orders per slot)
        ↓
Display Slots
 (with fill%, status, emoji)
```

---

## Query Examples

### Get orders for a specific slot today
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const orders = await Order.find({
  timeSlot: "08:30 - 09:00",
  createdAt: { $gte: today, $lt: tomorrow },
  status: { $nin: ['collected', 'cancelled'] }
});

console.log(`Orders in slot: ${orders.length}`);
```

### Get all orders for today grouped by slot
```typescript
const orders = await Order.find({
  createdAt: { $gte: today, $lt: tomorrow }
}).select('timeSlot status');

const bySlot = orders.reduce((acc, order) => {
  const slot = order.timeSlot;
  acc[slot] = acc[slot] || [];
  acc[slot].push(order);
  return acc;
}, {});

console.log(bySlot);
```

---

## Testing Examples

```javascript
// Test slot calculation
const fill = calculateFillPercentage(10, 20);  // 50%
const status = getSlotStatus(fill);  // 'Busy'
const message = getStatusMessage(status);  // '🟡 Slight Delay'

// Test API response format
const slotResponse = {
  time: "08:30 - 09:00",
  fill: 45,  // %
  status: "Open",
  orderCount: 9,
  maxCapacity: 20,
  statusMessage: "🟢 Fast Delivery"
};

// Test order with slot
const orderData = {
  items: [...],
  total: 599.99,
  timeSlot: "08:30 - 09:00",
  paymentMethod: "Card"
};
```

---

## Configuration

### Adjustable Parameters

```typescript
// Max orders per slot
MAX_ORDERS_PER_SLOT = 20

// Status thresholds (in getSlotStatus)
Open: 0-49%
Busy: 50-84%
Full: 85-100%

// Refresh interval (in SlotsTimings)
setInterval(..., 10000)  // 10 seconds

// Time slots (in slots/route.ts)
08:30 - 09:00
09:00 - 09:30
... (16 slots total)
```

---

## Complete ✅

All code references for dynamic slot management implementation.
