/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically called by Next.js on server startup.
 * It initializes the WebSocket server for both dev and production.
 * 
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { Server as HttpServer } from 'http';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeWebSocketServer } = await import('@/lib/websocket/bootstrap');

    // Get the HTTP server instance from the global scope
    // This is set by the custom server or Next.js
    const httpServer = (global as any).__httpServer;

    if (httpServer) {
      try {
        await initializeWebSocketServer(httpServer);
      } catch (err) {
        console.error('Failed to initialize WebSocket in instrumentation:', err);
      }
    } else {
      console.warn('HTTP server not available in instrumentation hook. WebSocket may initialize later.');
    }
  }
}
