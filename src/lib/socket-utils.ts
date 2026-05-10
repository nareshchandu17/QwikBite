import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';

declare global {
  var _io: SocketIOServer | undefined;
}

// Initialize WebSocket server
export const initSocketIO = (server: Server) => {
  if (global._io) {
    console.log('Socket.IO already initialized');
    return global._io;
  }

  console.log('Initializing Socket.IO...');
  
  const io = new SocketIOServer(server, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  global._io = io;
  return io;
};

// Get the WebSocket server instance
export const getSocketIO = () => {
  if (!global._io) {
    throw new Error('Socket.IO not initialized');
  }
  return global._io;
};

// Emit an event to all connected clients
export const emitToAll = (event: string, data: any) => {
  if (global._io) {
    global._io.emit(event, data);
  } else {
    console.warn('Socket.IO not initialized, cannot emit event:', event);
  }
};
