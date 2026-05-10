import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';

export interface SocketServerWithIO extends NetServer {
  io?: SocketIOServer;
}

export type NextApiResponseWithSocket = Omit<NextApiResponse, 'socket'> & {
  socket: SocketServerWithIO & {
    server: SocketServerWithIO & {
      io?: SocketIOServer;
    };
  };
};

// WebSocket Events
export const ORDER_EVENTS = {
  ORDER_UPDATED: 'order:updated',
  ORDER_CREATED: 'order:created',
  ORDER_CANCELLED: 'order:cancelled',
  ORDER_READY: 'order:ready',
  ORDER_DELIVERED: 'order:delivered'
} as const;

// Order Status Messages
export const ORDER_STATUS_MESSAGES = {
  pending: 'Order received 📝',
  received: 'Order confirmed ✅',
  preparing: 'Preparing your food 🍳',
  ready: 'Ready for pickup 🎉',
  out_for_delivery: 'On the way 🚚',
  delivered: 'Delivered successfully 🎊',
  cancelled: 'Order cancelled ❌'
} as const;

// Initialize Socket.IO
export const initSocketIO = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log('[Socket.IO] Initializing server...');
    
    const httpServer: NetServer = res.socket.server as unknown as NetServer;
    const _io = new SocketIOServer(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    // Connection handling
    io.on('connection', (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);
      
      // Join user-specific room for personal orders
      socket.on('join:user', (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] User ${userId} joined their room`);
      });
      
      // Join order-specific room for order updates
      socket.on('join:order', (orderId: string) => {
        socket.join(`order:${orderId}`);
        console.log(`[Socket.IO] Client joined order room: ${orderId}`);
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      });
    });
    
    res.socket.server.io = io;
  }
  
  return res.socket.server.io;
};

// Emit order update event
export const emitOrderUpdate = (
  io: SocketIOServer,
  orderId: string,
  status: string,
  userId?: string,
  additionalData?: Record<string, unknown>
) => {
  const message = ORDER_STATUS_MESSAGES[status as keyof typeof ORDER_STATUS_MESSAGES] || 'Order updated';
  
  const eventData = {
    orderId,
    status,
    message,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  // Emit to order-specific room
  io.to(`order:${orderId}`).emit(ORDER_EVENTS.ORDER_UPDATED, eventData);
  
  // Emit to user-specific room if userId is provided
  if (userId) {
    io.to(`user:${userId}`).emit(ORDER_EVENTS.ORDER_UPDATED, eventData);
  }
  
  // Emit to general room for admin/staff
  io.to('admin').emit(ORDER_EVENTS.ORDER_UPDATED, eventData);
  
  console.log(`[Socket.IO] Emitted order update:`, eventData);
};

// Socket.IO API Route Handler
export const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  const _io = initSocketIO(req, res);
  
  res.socket.server.io?.on('connection', (socket) => {
    console.log(`[Socket.IO] New connection: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Disconnection: ${socket.id}`);
    });
  });
  
  res.end();
};
