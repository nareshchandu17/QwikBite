import { NextResponse } from 'next/server';
import { ORDERS } from '@/data/mockOrders';

// This is a mock implementation since Next.js API routes don't support WebSockets directly
// In a real implementation, you would use a WebSocket server like Socket.IO or native WebSockets

// Simulate order status updates for demonstration
const simulateOrderUpdates = (orderId: string, sendUpdate: (data: unknown) => void) => {
  const order = ORDERS.find(o => o.id === orderId);
  if (!order) return;

  // Simulate status progression
  const statuses = ['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];
  let currentIndex = statuses.indexOf(order.status);
  
  const interval = setInterval(() => {
    if (currentIndex < statuses.length - 1) {
      currentIndex++;
      const newStatus = statuses[currentIndex];
      
      // Update the order in our mock data
      const orderIndex = ORDERS.findIndex(o => o.id === orderId);
      if (orderIndex !== -1) {
        ORDERS[orderIndex].status = newStatus as MockOrder['status'];
        
        // Send update to client
        sendUpdate({
          type: 'status_update',
          orderId,
          status: newStatus,
          message: getOrderStatusMessage(newStatus, orderId),
          timestamp: new Date().toISOString()
        });
      }
    } else {
      clearInterval(interval);
    }
  }, 10000); // Update every 10 seconds for demo purposes

  return interval;
};

const getOrderStatusMessage = (status: string, orderId: string) => {
  switch (status) {
    case 'Preparing':
      return `Your order ${orderId} is now being prepared 🍳`;
    case 'Ready':
      return `Your order ${orderId} is ready! Please collect before ${new Date(Date.now() + 20 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ⏰`;
    case 'Out for Delivery':
      return `Your order ${orderId} is on its way! 🚚`;
    case 'Delivered':
      return `Your order ${orderId} has been delivered! Enjoy your meal! 🎉`;
    default:
      return `Order ${orderId} status updated to: ${status}`;
  }
};

// This is a placeholder since Next.js API routes don't natively support WebSockets
// In a real implementation, you would use:
// import { Server as SocketIOServer } from 'socket.io';
// import { NextApiResponse } from 'next';

export async function GET(request: Request, { params }: { params: { orderId: string } }) {
  // This is a mock response since we can't actually upgrade to WebSocket in Next.js API routes
  return NextResponse.json({ 
    message: "WebSocket endpoint for order tracking",
    orderId: params.orderId,
    note: "In a real implementation, this would establish a WebSocket connection"
  });
}
