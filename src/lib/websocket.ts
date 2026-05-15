import { io, Socket } from 'socket.io-client';

/**
 * PRODUCTION-GRADE WEBSOCKET CLIENT (DEBUG VERSION)
 */

type EventMap = {
  'order:update': (data: { orderId: string; status: string; message?: string; timestamp?: string }) => void;
  'order_update': (data: { orderId: string; status: string }) => void;
  'admin:new_order': (data: any) => void;
  'admin:order_updated': (data: any) => void;
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  'reconnect_attempt': (attempt: number) => void;
  'error': (error: Error) => void;
  'room_joined': (data: { room: string }) => void;
  'room_left': (data: { room: string }) => void;
  'test_response': (data: unknown) => void;
  // Allow other string keys but don't force them to match the args exactly if they are specific
  [key: string]: (...args: any[]) => void;
};

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _isConnected = false;
  private currentNamespace: string | null = null;
  private isConnecting = false;
  private instanceId: string;
  
  public get isConnected(): boolean {
    return this._isConnected;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  constructor() {
    this.instanceId = Math.random().toString(36).substring(7);
    // console.log(`[CLIENT INSTANCE] Created ID: ${this.instanceId}`, Date.now());
  }

  public connect(namespace: string = '/customer', token?: string): void {
    if (this.isConnecting) {
        console.log(`[CLIENT ${this.instanceId}] Connection already in progress...`);
        return;
    }

    if (this.socket?.connected) {
      if (this.currentNamespace === namespace) {
        console.log(`[CLIENT ${this.instanceId}] Already connected to ${namespace}`);
        return;
      }
      console.log(`[CLIENT ${this.instanceId}] Switching namespace to ${namespace}`);
      this.socket.disconnect();
    }

    this.isConnecting = true;
    this.currentNamespace = namespace;
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
    
    console.log(`[CLIENT ${this.instanceId}] Connecting to ${baseUrl}${namespace}`);

    this.socket = io(`${baseUrl}${namespace}`, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      transports: ['polling', 'websocket'], // Prefer polling first for dev stability, upgrade to websocket later
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log(`[CLIENT ${this.instanceId}] ✅ CONNECTED | ID: ${this.socket?.id}`);
      this._isConnected = true;
      this.isConnecting = false;
      this.trigger('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[CLIENT ${this.instanceId}] ❌ DISCONNECTED | Reason: ${reason}`);
      this._isConnected = false;
      this.isConnecting = false;
      this.trigger('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error(`[CLIENT ${this.instanceId}] ⚠️ ERROR: ${error.message}`);
      this.isConnecting = false;
      this.trigger('connect_error', error);
    });

    // Generic listener for all registered events
    const events = ['order:update', 'admin:new_order', 'admin:order_updated', 'room_joined'];
    events.forEach(event => {
      this.socket?.on(event, (data) => {
        this.trigger(event, data);
      });
    });
  }

  public on<K extends keyof EventMap & string>(event: K, listener: EventMap[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as any);
    return () => this.off(event, listener);
  }

  public off<K extends keyof EventMap & string>(event: K, listener: EventMap[K]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener as any);
    }
  }

  private trigger(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`[CLIENT ${this.instanceId}] Listener Error (${event}):`, error);
        }
      });
    }
  }

  public emit(event: string, ...args: any[]): void {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
    } else {
      console.warn(`[CLIENT ${this.instanceId}] Cannot emit '${event}': not connected`);
    }
  }

  public joinRoom(room: string): void {
    this.emit('order:join', room);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentNamespace = null;
      this._isConnected = false;
      this.isConnecting = false;
    }
  }
}

/**
 * HMR-SAFE SINGLETON
 */
declare global {
  var websocketClientInstance: WebSocketClient | undefined;
}

const websocketClient = global.websocketClientInstance || new WebSocketClient();

if (process.env.NODE_ENV !== 'production') {
  global.websocketClientInstance = websocketClient;
}

export { websocketClient };
export default websocketClient;
