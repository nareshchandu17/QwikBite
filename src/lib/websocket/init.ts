import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

declare global {
  var io: Server | undefined;
}

// Type for the global io instance
declare const global: typeof globalThis & {
  io?: Server;
};

interface MenuData {
  id: string;
  name: string;
  price?: number;
  description?: string;
}

interface OrderData {
  id: string;
  status: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  userId: string;
  createdAt: Date;
}

let io: Server | null = null;

export function initWebSocket(server: HttpServer) {
  if (!io) {
    io = new Server(server, {
      path: '/api/socket/io',
      addTrailingSlash: false,
    });

    io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      // Menu events
      socket.on('menu:update', (data: MenuData) => {
        console.log('Menu update received:', data);
        socket.broadcast.emit('menu:updated', data);
      });

      socket.on('menu:create', (data: MenuData) => {
        console.log('Menu create received:', data);
        socket.broadcast.emit('menu:created', data);
      });

      socket.on('menu:delete', (data: { id: string }) => {
        console.log('Menu delete received:', data);
        socket.broadcast.emit('menu:deleted', data);
      });

      // Order events
      socket.on('order:update', (data: OrderData) => {
        console.log('Order update received:', data);
        socket.broadcast.emit('order:updated', data);
      });

      socket.on('order:create', (data: OrderData) => {
        console.log('Order create received:', data);
        socket.broadcast.emit('order:created', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // Store the io instance globally
    if (!global.io) {
      global.io = io;
    }
  }

  return io;
}
