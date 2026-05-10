import { Server as HttpServer } from 'http';
import { Server as WebSocketServer, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { attachSocketLogging } from './logger';
import { startRateLimiterCleanup } from './ratelimit';

type MaybeIO = WebSocketServer | null;

/**
 * PRODUCTION-GRADE SOCKET MANAGER (SERVER)
 * Features:
 * - Robust CORS (Dynamic in Dev)
 * - Middleware for Auth & Rate Limiting
 * - Support for Admin and Customer namespaces
 * - Clean event broadcasting
 */
export class SocketManager {
  private static instance: SocketManager;
  private io: MaybeIO = null;
  // Map of socketId -> userId
  private clients: Map<string, string> = new Map();

  private constructor() { }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public async initialize(server: HttpServer) {
    if (this.io) return;

    console.log('[SOCKET SERVER] Initializing Socket.IO server...');

    this.io = new WebSocketServer(server, {
      cors: {
        origin: (origin, callback) => {
          // Allow all origins in development to prevent CORS headaches
          if (process.env.NODE_ENV !== 'production') {
            callback(null, true);
            return;
          }
          // In production, enforce the allowed origins
          const allowedOrigins = [
            process.env.NEXT_PUBLIC_APP_URL,
            'https://qwikbite.vercel.app' // Example production URL
          ].filter(Boolean);

          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/api/socket/io',
      addTrailingSlash: false,
      transports: ['websocket'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Attach logging middleware
    try {
      attachSocketLogging(this.io);
      console.log('✓ Socket.IO event logging enabled');
    } catch (_err) {
      console.warn('✗ Could not attach logging:', _err);
    }

    // Start rate limiter cleanup
    startRateLimiterCleanup();

    // Generic middleware for authentication
    this.io.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
          console.log(`[SOCKET AUTH] Anonymous connection: ${socket.id}`);
          return next();
        }

        const secret = process.env.JWT_SECRET || 'fallback-secret';
        const payload = jwt.verify(String(token), secret) as { sub?: string; id?: string };

        if (payload && (payload.sub || payload.id)) {
          const userId = String(payload.sub || payload.id);
          (socket.data as { userId: string }).userId = userId;
          this.clients.set(socket.id, userId);
          console.log(`[SOCKET AUTH] User ${userId} authenticated: ${socket.id}`);
        }
        return next();
      } catch (_err) {
        console.warn(`[SOCKET AUTH FAILED] ${socket.id}:`, (_err as Error).message);
        return next(); // Still allow connection but as guest
      }
    });

    // --- NAMESPACE: ADMIN ---
    const adminNs = this.io.of('/admin');
    adminNs.on('connection', (socket: Socket) => {
      console.log(`[ADMIN CONNECTED] ${socket.id}`);

      socket.on('disconnect', () => {
        this.clients.delete(socket.id);
      });
    });

    // --- NAMESPACE: CUSTOMER ---
    const customerNs = this.io.of('/customer');
    customerNs.on('connection', (socket: Socket) => {

      socket.on('join:room', (room: string, ack?: (res: unknown) => void) => {
        socket.join(room);
        console.log(`[SOCKET ROOM] ${socket.id} joined ${room}`);
        ack?.({ ok: true, room });
      });

      socket.on('disconnect', (_reason) => {
        this.clients.delete(socket.id);
      });
    });

    console.log('✓ WebSocket server fully initialized');
  }

  public emitToAll(event: string, data: unknown) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  public async emitToUser(userId: string, event: string, data: unknown) {
    if (!this.io) return;
    const nsp = this.io.of('/customer');
    const sockets = await nsp.fetchSockets();
    for (const s of sockets) {
      const uid = (s.data as { userId?: string })?.userId || this.clients.get(s.id);
      if (String(uid) === String(userId)) {
        s.emit(event, data);
      }
    }
  }

  public emitToRoom(room: string, event: string, data: unknown) {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
  }

  public getIO(): MaybeIO {
    return this.io;
  }
}

export const socketManager = SocketManager.getInstance();

export function getIO() {
  return socketManager.getIO();
}
