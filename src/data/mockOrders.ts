// Mock order data for WebSocket demonstration
export interface MockOrder {
  id: string;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Delivered';
  customerName: string;
  items: string[];
  totalAmount: number;
  createdAt: Date;
}

export const ORDERS: MockOrder[] = [
  {
    id: 'order-1',
    status: 'Pending',
    customerName: 'John Doe',
    items: ['Burger', 'Fries', 'Coke'],
    totalAmount: 12.99,
    createdAt: new Date()
  },
  {
    id: 'order-2',
    status: 'Preparing',
    customerName: 'Jane Smith',
    items: ['Pizza', 'Salad'],
    totalAmount: 15.99,
    createdAt: new Date()
  },
  {
    id: 'order-3',
    status: 'Ready',
    customerName: 'Bob Johnson',
    items: ['Sandwich', 'Chips'],
    totalAmount: 8.99,
    createdAt: new Date()
  }
];
