import { websocketClient } from './websocket';

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
      connect: () => {}
    } as any;
  }

  // Connect to the requested namespace (though mocked in Pusher implementation)
  if (!websocketClient.isConnected) {
    websocketClient.connect(opts.namespace);
  }

  return websocketClient;
}

export function closeSocket() {
  websocketClient.disconnect();
}

export { websocketClient as socketInstance };