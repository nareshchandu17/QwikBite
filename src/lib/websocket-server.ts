import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import Feedback, { IFeedback } from '@/lib/models/Feedback';
import { aggregateTimeSlots } from './slot-utils';

export function setupWebSocketServer(server: HttpServer) {
  const io = new SocketIOServer(server, {
    path: '/api/socket/io',
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? 'https://your-production-domain.com'
        : 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  const broadcastTimeslots = async () => {
    try {
      await connectDB();
      const slots = await aggregateTimeSlots();
      io.emit('timeslot:update', slots);
      console.log('Broadcasted timeslot updates');
    } catch (_err) {
      console.error('error broadcasting timeslots:', _err);
    }
  };

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Handle feedback events
    socket.on('feedback:send', async (data) => {
      try {
        await connectDB();
        const feedback = await Feedback.create(data);

        // Broadcast to all connected clients
        io.emit('feedback:new', feedback);
        console.log('New feedback broadcasted:', feedback._id);
      } catch (_error) {
        console.error('error handling feedback:send:', _error);
        socket.emit('error', { message: 'Failed to save feedback' });
      }
    });

    socket.on('feedback:update', async ({ id, updates }) => {
      try {
        await connectDB();
        const feedback = await Feedback.findByIdAndUpdate(id, updates, { new: true });

        if (feedback) {
          // Broadcast to all connected clients
          io.emit('feedback:update', feedback);
          console.log('Feedback updated broadcasted:', feedback._id);
        }
      } catch (_error) {
        console.error('error handling feedback:update:', _error);
        socket.emit('error', { message: 'Failed to update feedback' });
      }
    });

    socket.on('feedback:fetch', async () => {
      try {
        await connectDB();
        const feedbacks = await Feedback.find({}).sort({ createdAt: -1 });
        socket.emit('feedback:init', feedbacks);
      } catch (_error) {
        console.error('error fetching feedbacks:', _error);
        socket.emit('error', { message: 'Failed to fetch feedbacks' });
      }
    });

    // Handle notification events
    socket.on('notification:send', (data) => {
      io.emit('notification:new', data);
      console.log('New notification broadcasted:', data);
    });

    socket.on('notification:fetch', () => {
      socket.emit('notification:init', []); // Initialize with empty array
    });

    // 🍕 Handle Order Events

    // Customer joins their order room to listen for updates
    socket.on('order:join', (orderId) => {
      if (orderId) {
        socket.join(`order_${orderId}`);
        console.log(`Socket ${socket.id} joined room: order_${orderId}`);
      }
    });

    // New Order placed (Client -> Server -> Admin Broadcast)
    socket.on('order:created', (orderData) => {
      // Broadcast to all admins (or anyone listening to 'order:new')
      io.emit('order:new', orderData);
      console.log('New order broadcasted:', orderData.id);

      // Also update slot usage
      broadcastTimeslots();
    });

    // Order Status Update (Admin -> Server -> Customer Room Broadcast)
    socket.on('order:status_change', ({ orderId, status, updatedOrder }) => {
      // Broadcast to the specific order room (for the customer)
      io.to(`order_${orderId}`).emit('order:update', { status, order: updatedOrder });

      // Also broadcast to admins so other admin dashboards update (optional, but good)
      io.emit('order:update_global', updatedOrder);

      console.log(`Order ${orderId} status updated to ${status}`);

      // Also update slot usage if status changed to/from cancelled
      broadcastTimeslots();
    });

    // Handle WebSocket events
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // 🤖 AI Assistant Events

    // AI triggered cart update
    socket.on('ai:cart_updated', (data) => {
      const { userId, cart } = data;
      // Broadcast to specific user
      io.to(`user_${userId}`).emit('cart:update', cart);
      console.log(`AI updated cart for user ${userId}`);
    });

    // AI classified feedback - alert admin
    socket.on('ai:feedback_classified', (data) => {
      const { feedbackId, classification, severity } = data;

      // Broadcast to admin room
      io.to('admin:feedback').emit('feedback:ai_alert', {
        feedbackId,
        classification,
        severity,
        timestamp: new Date()
      });

      console.log(`AI classified feedback ${feedbackId} as ${severity}`);
    });

    // AI generated admin alert
    socket.on('ai:admin_alert', (data) => {
      io.to('admin:dashboard').emit('admin:alert', {
        ...data,
        source: 'ai',
        timestamp: new Date()
      });
      console.log('AI generated admin alert:', data.type);
    });
  });

  return io;
}

function connectDB() {
  // Placeholder - actual implementation in db.ts
  return Promise.resolve();
}
