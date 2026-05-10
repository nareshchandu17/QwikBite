import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { mongoDBService } from '../db/mongodb';

interface JoinRoomData {
  orderId: string;
}

interface UpdateStatusData {
  orderId: string;
  status: string;
}

// Initialize WebSocket server
export function initWebSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Store connected clients
  const connectedClients = new Map();

  // Handle socket connections
  io.on('connection', (socket: Socket) => {
    console.log('New client connected:', socket.id);

    // Handle joining an order room
    socket.on('join_order_room', (data: unknown) => {
      const { orderId } = data as JoinRoomData;
      if (orderId) {
        socket.join(`order_${orderId}`);
        console.log(`Client ${socket.id} joined room for order ${orderId}`);
        
        // Store client info
        connectedClients.set(socket.id, { orderId, socket });
        
        // Send confirmation to client
        socket.emit('room_joined', { orderId, message: `Joined room for order ${orderId}` });
      }
    });

    // Handle leaving an order room
    socket.on('leave_order_room', (data: unknown) => {
      const { orderId } = data as JoinRoomData;
      if (orderId) {
        socket.leave(`order_${orderId}`);
        console.log(`Client ${socket.id} left room for order ${orderId}`);
        
        // Send confirmation to client
        socket.emit('room_left', { orderId, message: `Left room for order ${orderId}` });
      }
    });

    // Handle manual order status update (for admin panel)
    socket.on('update_order_status', async (data: unknown) => {
      const { orderId, status } = data as UpdateStatusData;
      try {
        // Update order in database
        const db = mongoDBService.getDb();
        const ordersCollection = db.collection('orders');
        const order = await ordersCollection.findOneAndUpdate(
          { id: orderId },
          { $set: { status: status } },
          { returnDocument: 'after' }
        );
        
        if (order && order.value) {
          // Emit update to room
          const roomName = `order_${orderId}`;
          io.to(roomName).emit('order_update', {
            type: 'status_update',
            orderId: order.value.id,
            status: order.value.status,
            message: getOrderStatusMessage(order.value.status, order.value.id),
            timestamp: new Date().toISOString()
          });
          
          // Also emit to general orders list
          io.emit('order_updated', order.value);
          
          console.log(`Order ${orderId} updated to ${status}`);
        }
      } catch (err) {
        console.error('Error updating order status:', err);
        socket.emit('error', { type: 'update_order_status_error', message: 'Failed to update order status' });
      }
    });

    // Handle test messages
    socket.on('test_message', (data: unknown) => {
      console.log('Received test message:', data);
      socket.emit('test_response', { 
        message: 'Test message received', 
        data,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      connectedClients.delete(socket.id);
    });
  });

  return io;
}

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

// Function to simulate order status updates (in a real app, this would be triggered by actual events)
export async function simulateOrderUpdates() {
  try {
    const db = mongoDBService.getDb();
    const ordersCollection = db.collection('orders');
    // Get all orders with status other than 'Delivered'
    const orders = await ordersCollection.find({
      status: {
        $ne: 'Delivered'
      }
    }).toArray();

    for (const order of orders) {
      // Simulate status progression
      const statuses = ['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];
      const currentIndex = statuses.indexOf(order.status);
      
      if (currentIndex < statuses.length - 1) {
        const nextStatus = statuses[currentIndex + 1];
        
        // Update order in database
        const updatedOrder = await ordersCollection.findOneAndUpdate(
          { id: order.id },
          { $set: { status: nextStatus } },
          { returnDocument: 'after' }
        );
        
        if (updatedOrder && updatedOrder.value) {
          // Emit update to room
          // Note: We need to access the io instance here, which we'll handle in the initialization
          console.log(`Order ${order.id} updated to ${nextStatus}`);
        }
      }
    }
  } catch (err) {
    console.error('Error in simulateOrderUpdates:', err);
  }
}
