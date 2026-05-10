import { Socket } from 'socket.io-client';

type EventMap = {
  'feedback:received': (data: unknown) => void;
  'feedback:replied': (data: unknown) => void;
  'notification:new': () => void;
  'notifications:unread_count': (count: number) => void;
  'connect': () => void;
  'disconnect': (_reason: string) => void;
  '_error': (_error: { message: string }) => void;
};

class ProductionSocketClient {
  private static instance: ProductionSocketClient;
  private socket: Socket | null = null;
  private listeners: {
    [K in keyof EventMap]?: Set<EventMap[K]>;
  } = {};
  private _isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentToken: string | null = null;

  private constructor() {}

  public get isConnected(): boolean {
    return this._isConnected;
  }

  public static getInstance(): ProductionSocketClient {
    if (!ProductionSocketClient.instance) {
      ProductionSocketClient.instance = new ProductionSocketClient();
    }
    return ProductionSocketClient.instance;
  }

  public connect(token: string): void {
    // Temporarily disable socket connection for development
    console.log('Socket connection temporarily disabled for development');
    this._isConnected = false;
    return;

    /* 
    // Original socket connection logic - uncomment for production
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.currentToken = token;

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      path: '/api/socket/io',
      addTrailingSlash: false,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
    */
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', this.handleConnect);
    this.socket.on('disconnect', this.handleDisconnect);
    this.socket.on('connect_error', this.handleConnectError);
    this.socket.on('error', this.handleError);

    // Forward socket events to registered listeners
    this.socket.on('feedback:received', (data) => this.emit('feedback:received', data));
    this.socket.on('feedback:replied', (data) => this.emit('feedback:replied', data));
    this.socket.on('notification:new', () => this.emit('notification:new'));
    this.socket.on('notifications:unread_count', (count) => this.emit('notifications:unread_count', count));
  }

  private handleConnect = (): void => {
    console.log('Production Socket connected');
    this._isConnected = true;
    this.reconnectAttempts = 0;
    this.emit('connect');
  };

  private handleDisconnect = (reason: string): void => {
    console.log('Production Socket disconnected:', reason);
    this._isConnected = false;
    
    // Attempt to reconnect if this wasn't a manual disconnection
    if (reason !== 'io client disconnect') {
      this.handleReconnect();
    }
    
    this.emit('disconnect', reason);
  };

  private handleConnectError = (error: any): void => {
    console.error('Socket connection error:', error);
    this.emit('_error', { message: error.message });
  };

  private handleError = (error: unknown): void => {
    const err = error as { message?: string };
    console.error('Socket error:', err);
    this.emit('_error', { message: err.message || 'Unknown socket error' });
  };

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.currentToken) {
        this.connect(this.currentToken);
      }
    }, delay);
  }

  public on<K extends keyof EventMap>(
    event: K,
    listener: EventMap[K]
  ): () => void {
    if (!(this.listeners as any)[event]) {
      (this.listeners as any)[event] = new Set();
    }
    ((this.listeners as any)[event]).add(listener);
    return () => this.off(event, listener);
  }

  public off<K extends keyof EventMap>(
    event: K,
    listener: EventMap[K]
  ): void {
    const listeners = this.listeners[event];
    if (listeners) {
      (listeners as unknown as Set<EventMap[K]>).delete(listener);
    }
  }

  private emit<K extends keyof EventMap>(
    event: K,
    ...args: Parameters<EventMap[K]>
  ): void {
    const listeners = (this.listeners as any)[event];
    if (listeners) {
      try {
        for (const listener of listeners) {
          listener(...args);
        }
      } catch (error) {
        console.error(`error in ${event} handler:`, error);
      }
    }
  }

  public sendFeedback(message: string): void {
    if (this.socket?.connected) {
      this.socket.emit('feedback:new', { message });
    } else {
      console.warn('Socket not connected, cannot send feedback');
    }
  }

  public replyToFeedback(feedbackId: string, reply: string, customerId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('feedback:reply', { feedbackId, reply, customerId });
    } else {
      console.warn('Socket not connected, cannot reply to feedback');
    }
  }

  public markNotificationsAsRead(notificationIds: string[]): void {
    if (this.socket?.connected) {
      this.socket.emit('notifications:mark_read', notificationIds);
    } else {
      console.warn('Socket not connected, cannot mark notifications as read');
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._isConnected = false;
      this.currentToken = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Clear all listeners
    this.listeners = {};
    this.reconnectAttempts = 0;
  }

  public reconnect(): void {
    if (this.currentToken) {
      this.disconnect();
      setTimeout(() => this.connect(this.currentToken!), 1000);
    } else {
      console.warn('No token available for reconnection');
    }
  }
}

export const productionSocket = ProductionSocketClient.getInstance();
export default productionSocket;
