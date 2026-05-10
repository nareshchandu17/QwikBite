export type OrderStatus = 'received' | 'preparing' | 'almost_ready' | 'ready' | 'collected' | 'delivered' | 'pending' | 'out_for_delivery' | 'cancelled' | 'delayed';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  qty?: number; // Alias for quantity
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  timestamp: string;
  message?: string;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  rating: number;
  image?: string;
}

export interface PaymentInfo {
  method: string;
  status: string;
  transactionId?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  estimatedTime: number; // in minutes
  etaMinutes?: number; // Alias for estimatedTime
  pickupCounter: string;
  orderTime: string;
  createdAt: string | Date; // Alias for orderTime (now required)
  updatedAt?: string | Date; // Can be string or Date
  statusHistory: OrderStatusUpdate[];
  chefMessage?: string;
  payment?: PaymentInfo;
  paymentMethod?: string;
  feedbackGiven?: boolean;
  deliveryPerson?: DeliveryPerson;
  customerName?: string; // Optional customer name for display
  username?: string; // Optional username for display
  timeSlot?: string; // Time slot selected for order (e.g., "08:30 - 09:00")
}
