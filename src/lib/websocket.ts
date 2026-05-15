import { getPusherClient } from './pusher';

/**
 * PRODUCTION-GRADE WEBSOCKET CLIENT USING PUSHER
 */

type EventMap = {
  'order:update': (data: { orderId: string; status: string; message?: string; timestamp?: string }) => void;
  'order_update': (data: { orderId: string; status: string }) => void;
  'admin:new_order': (data: any) => void;
  'admin:order_updated': (data: any) => void;
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  'error': (error: Error) => void;
  [key: string]: (...args: any[]) => void;
};

class WebSocketClient {
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _isConnected = false;
  private currentRoom: string | null = null;
  private pusherChannel: any = null;
  
  public get isConnected(): boolean {
    return this._isConnected;
  }

  constructor() {
    // Initialized
  }

  public connect(namespace: string = '/customer', token?: string): void {
    const pusher = getPusherClient();
    if (!pusher) return;

    // In Pusher, connection is handled globally by the instance
    // We just simulate the connect event
    if (!this._isConnected) {
      pusher.connection.bind('connected', () => {
        this._isConnected = true;
        this.trigger('connect');
      });
      pusher.connection.bind('disconnected', () => {
        this._isConnected = false;
        this.trigger('disconnect', 'pusher_disconnected');
      });
      pusher.connection.bind('error', (err: any) => {
        this.trigger('error', new Error(err.message || 'Pusher error'));
      });
    }

    if (pusher.connection.state === 'connected') {
      this._isConnected = true;
      setTimeout(() => this.trigger('connect'), 0);
    }
  }

  // Generic on event for socket.io style listeners
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
          console.error(`[Pusher Client] Listener Error (${event}):`, error);
        }
      });
    }
  }

  // We can't really emit events to other clients without a backend in Pusher,
  // but we can handle 'order:join' which is typically sent by client to join a room
  public emit(event: string, ...args: any[]): void {
    if (event === 'order:join' || event === 'join:room') {
      const room = args[0] as string;
      this.joinRoom(room);
    }
  }

  public joinRoom(room: string): void {
    const pusher = getPusherClient();
    if (!pusher) return;

    // Unsubscribe from previous room if any
    if (this.currentRoom && this.pusherChannel) {
      pusher.unsubscribe(this.currentRoom);
      this.pusherChannel.unbind_all();
    }

    const sanitizedRoom = room.replace(/:/g, '-');
    this.currentRoom = sanitizedRoom;
    this.pusherChannel = pusher.subscribe(sanitizedRoom);

    // Bind common events that the frontend expects
    this.pusherChannel.bind('order:updated', (data: any) => {
      this.trigger('order:update', data);
      this.trigger('order_update', data); // fallback
    });
    
    // Fallback if someone emits exact names
    this.pusherChannel.bind('order:update', (data: any) => this.trigger('order:update', data));
    this.pusherChannel.bind('order_update', (data: any) => this.trigger('order_update', data));
    
    console.log(`[Pusher Client] Joined channel: ${sanitizedRoom}`);
  }

  public disconnect(): void {
    const pusher = getPusherClient();
    if (pusher && this.currentRoom) {
      pusher.unsubscribe(this.currentRoom);
    }
    this.currentRoom = null;
    this.pusherChannel = null;
    this._isConnected = false;
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
