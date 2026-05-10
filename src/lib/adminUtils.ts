import { useRouter } from 'next/navigation';

// Mock data for demonstration
const MOCK_DATA = {
  analytics: {
    totalOrders: 1245,
    revenue: 45678.90,
    activeUsers: 342,
    popularItems: [
      { id: 1, name: 'Margherita Pizza', orders: 245 },
      { id: 2, name: 'Chicken Burger', orders: 198 },
      { id: 3, name: 'Caesar Salad', orders: 156 },
    ]
  },
  orders: Array.from({ length: 20 }, (_, i) => ({
    id: `#${1000 + i}`,
    customer: `Customer ${i + 1}`,
    items: Math.ceil(Math.random() * 5),
    total: (Math.random() * 100 + 10).toFixed(2),
    status: ['pending', 'preparing', 'ready', 'completed', 'cancelled'][Math.floor(Math.random() * 5)],
    time: new Date(Date.now() - Math.floor(Math.random() * 48) * 60 * 60 * 1000).toISOString()
  })),
  menuItems: [
    { id: 1, name: 'Margherita Pizza', category: 'Pizza', price: 12.99, available: true },
    { id: 2, name: 'Pepperoni Pizza', category: 'Pizza', price: 14.99, available: true },
    { id: 3, name: 'Chicken Burger', category: 'Burgers', price: 9.99, available: true },
    { id: 4, name: 'Caesar Salad', category: 'Salads', price: 8.99, available: true },
    { id: 5, name: 'Pasta Carbonara', category: 'Pasta', price: 11.99, available: false },
  ],
  users: Array.from({ length: 50 }, (_, i) => ({
    id: `U${1000 + i}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 5 === 0 ? 'admin' : 'user',
    lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    orders: Math.floor(Math.random() * 50)
  })),
  staff: Array.from({ length: 10 }, (_, i) => ({
    id: `S${100 + i}`,
    name: `Staff ${i + 1}`,
    role: i === 0 ? 'Manager' : i < 4 ? 'Chef' : 'Server',
    email: `staff${i + 1}@restaurant.com`,
    phone: `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: ['active', 'inactive', 'on_leave'][i % 3],
    joinDate: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString()
  })),
  feedback: Array.from({ length: 15 }, (_, i) => ({
    id: `F${100 + i}`,
    customer: `Customer ${i + 1}`,
    rating: Math.ceil(Math.random() * 5),
    comment: [
      'Great food and service!',
      'The pizza was cold when it arrived.',
      'Excellent experience, will come back!',
      'Service was a bit slow but food was good.',
      'Loved the atmosphere and the food was amazing!',
      'Order was incorrect but the staff fixed it quickly.'
    ][Math.floor(Math.random() * 6)],
    date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    status: ['new', 'in_review', 'resolved', 'closed'][Math.floor(Math.random() * 4)]
  })),
  timeSlots: [
    { id: 1, day: 'Monday', open: '11:00', close: '22:00', isOpen: true },
    { id: 2, day: 'Tuesday', open: '11:00', close: '22:00', isOpen: true },
    { id: 3, day: 'Wednesday', open: '11:00', close: '22:00', isOpen: true },
    { id: 4, day: 'Thursday', open: '11:00', close: '22:00', isOpen: true },
    { id: 5, day: 'Friday', open: '11:00', close: '23:00', isOpen: true },
    { id: 6, day: 'Saturday', open: '10:00', close: '23:00', isOpen: true },
    { id: 7, day: 'Sunday', open: '10:00', close: '22:00', isOpen: true },
  ]
};

export const useAdminNavigation = () => {
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
      case 'resolved':
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'in_review':
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'inactive':
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'preparing':
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return {
    ...MOCK_DATA,
    navigateTo,
    getStatusColor,
    formatDate,
    formatCurrency
  };
};

export const useAdminActions = () => {
  const handleAction = async (action: string, data: unknown) => {
    const { toast } = await import('sonner');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`${action} completed successfully`);
      
      return { success: true };
    } catch (error) {
      toast.error(`Failed to ${action}`);
      return { success: false, error };
    }
  };

  return {
    updateStatus: (id: string, status: string) => 
      handleAction('update status', { id, status }),
    deleteItem: (id: string) => 
      handleAction('delete item', { id }),
    updateItem: (id: string, data: unknown) => 
      handleAction('update item', { id, ...data }),
    createItem: (data: unknown) => 
      handleAction('create item', data)
  };
};
