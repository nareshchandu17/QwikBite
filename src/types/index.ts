// Re-export Order and related types from order.ts
export type { Order, OrderStatus } from './order';
export type { OrderItem, OrderStatusUpdate, DeliveryPerson, PaymentInfo } from './order';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  calories: number;
  image: string;
  category: string;
  tags: string[];
  available: boolean;
  prep_time?: number;
  availability?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;
  isPopular?: boolean;
  rating?: number;
}

export type Sentiment = 'Positive' | 'Neutral' | 'Negative';

export interface Feedback {
  id: number;
  customerName: string;
  avatar: string;
  rating: number;
  comment: string;
  sentiment: Sentiment;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  method: 'UPI' | 'Cash' | 'Card';
  status: 'Success' | 'Pending' | 'Failed';
  date: string;
}

export interface BaseStaff {
  name: string;
  email: string;
  role: 'Manager' | 'Chef' | 'Server' | 'Cashier' | 'Cleaner';
  avatar: string;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Off Shift';
  shift: string;
  contact: string;
  performance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Staff extends BaseStaff {
  _id: string;
  id?: string; // For backward compatibility
}
