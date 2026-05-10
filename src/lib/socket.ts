import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

interface GetSocketOptions {
  namespace?: string; // '/customer' or '/admin'
  token?: string;
}

export function getSocket(opts: GetSocketOptions = {}) {
  if (typeof window === 'undefined') {
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      disconnect: () => {},
    } as unknown as Socket;
  }

  if (socket) return socket;

  const namespace = opts.namespace || '/customer';
  const token = opts.token || (window.localStorage && window.localStorage.getItem('AUTH_TOKEN')) || undefined;

  const url = `${window.location.origin}${namespace}`;

  socket = io(url, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    autoConnect: true,
    transports: ['websocket'],
    auth: token ? { token } : undefined,
    // reconnection/backoff tuning for production
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connect_error', err);
  });

  return socket;
}

export function closeSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export { socket as socketInstance };