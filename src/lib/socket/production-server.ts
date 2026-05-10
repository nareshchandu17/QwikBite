import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import FeedbackMessage from '@/lib/models/FeedbackMessage';
import SystemNotification from '@/lib/models/SystemNotification';

interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
      role: 'admin' | 'customer';
    };
  };
}

export function initSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/api/socket/io',
    addTrailingSlash: false,
    transports: ['websocket', 'polling']
  });

  // JWT Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id?: string; userId?: string; role: 'admin' | 'customer' };
      const userId = decoded.id || decoded.userId;
      
      if (!userId) {
        return next(new Error('User ID not found in token'));
      }

      socket.data.user = {
        id: userId,
        role: decoded.role
      };
      
      console.log(`User authenticated: ${socket.data.user.id} (${socket.data.user.role})`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const { id, role } = socket.data.user;
    console.log(`Socket connected: ${socket.id} - User: ${id} (${role})`);

    // Join user-specific rooms
    socket.join(`${role}:${id}`);
    if (role === 'admin') {
      socket.join('admin:all');
    }

    /* CUSTOMER → ADMIN FEEDBACK FLOW */
    socket.on('feedback:new', async (payload: { message: string }) => {
      try {
        const feedback = await FeedbackMessage.create({
          customerId: id,
          message: payload.message,
          status: 'open'
        });

        // Populate customer details for admin
        await feedback.populate('customerDetails');

        // Create admin notification
        await SystemNotification.create({
          role: 'admin',
          title: 'New customer feedback received',
          link: '/admin/feedback',
          isRead: false
        });

        // Emit to all admins
        io.to('admin:all').emit('feedback:received', feedback);
        io.to('admin:all').emit('notification:new');

        console.log(`New feedback from customer ${id}: ${feedback._id}`);
      } catch (error) {
        console.error('Error handling new feedback:', error);
        socket.emit('error', { message: 'Failed to submit feedback' });
      }
    });

    /* ADMIN → CUSTOMER REPLY FLOW */
    socket.on('feedback:reply', async (payload: { 
      feedbackId: string; 
      reply: string; 
      customerId: string 
    }) => {
      try {
        const feedback = await FeedbackMessage.findByIdAndUpdate(
          payload.feedbackId,
          { 
            reply: payload.reply, 
            status: 'replied' 
          },
          { new: true }
        ).populate('customerDetails');

        if (!feedback) {
          socket.emit('error', { message: 'Feedback not found' });
          return;
        }

        // Create customer notification
        await SystemNotification.create({
          userId: payload.customerId,
          role: 'customer',
          title: 'Admin replied to your feedback',
          link: '/customer/feedback',
          isRead: false
        });

        // Emit to specific customer
        io.to(`customer:${payload.customerId}`).emit('feedback:replied', feedback);
        io.to(`customer:${payload.customerId}`).emit('notification:new');

        console.log(`Admin replied to feedback ${payload.feedbackId} for customer ${payload.customerId}`);
      } catch (error) {
        console.error('Error handling feedback reply:', error);
        socket.emit('error', { message: 'Failed to reply to feedback' });
      }
    });

    /* NOTIFICATION HANDLING */
    socket.on('notifications:mark_read', async (notificationIds: string[]) => {
      try {
        await SystemNotification.updateMany(
          { 
            _id: { $in: notificationIds },
            userId: role === 'customer' ? id : undefined,
            role: role
          },
          { isRead: true }
        );

        // Emit updated count to user
        const unreadCount = await SystemNotification.countDocuments({
          userId: role === 'customer' ? id : undefined,
          role: role,
          isRead: false
        });

        socket.emit('notifications:unread_count', unreadCount);
      } catch (error) {
        console.error('Error marking notifications as read:', error);
        socket.emit('error', { message: 'Failed to mark notifications as read' });
      }
    });

    /* CONNECTION HANDLING */
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} - Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    // Send initial unread count
    SystemNotification.countDocuments({
      userId: role === 'customer' ? id : undefined,
      role: role,
      isRead: false
    }).then(count => {
      socket.emit('notifications:unread_count', count);
    }).catch(error => {
      console.error('Error getting initial unread count:', error);
    });
  });

  console.log('Production Socket.IO server initialized');
  return io;
}

export default initSocket;
