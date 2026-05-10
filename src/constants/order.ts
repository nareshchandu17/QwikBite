import type { OrderStatus } from '@/types/order';

export const statusMessages: Record<OrderStatus, string> = {
  'received': 'Your order has been received successfully',
  'preparing': 'Your order is being prepared with care',
  'almost_ready': 'Your order is almost ready for pickup',
  'ready': 'Your order is ready for pickup',
  'collected': 'Your order has been collected. Enjoy your meal!',
  'delivered': 'Your order has been delivered',
  'pending': 'Your order is pending',
  'out_for_delivery': 'Your order is out for delivery',
  'delayed': 'Your order has been delayed',
  'cancelled': 'Your order has been cancelled',
} as const;
