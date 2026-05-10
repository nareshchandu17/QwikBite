/**
 * WebSocket Server Bootstrap
 *
 * This module ensures the Socket.IO server is initialized when the Next.js server starts.
 * It's called from the server middleware or Next.js startup hooks.
 */

import { Server as HttpServer } from 'http';
import { socketManager } from './server';

let initialized = false;

/**
 * Initialize the WebSocket server with the HTTP server instance.
 * Safe to call multiple times (idempotent).
 */
export async function initializeWebSocketServer(httpServer: HttpServer) {
  if (initialized) {
    console.log('WebSocket server already initialized');
    return;
  }

  try {
    await socketManager.initialize(httpServer);
    initialized = true;
    console.log('✓ WebSocket server initialized successfully');
  } catch (err) {
    console.error('✗ Failed to initialize WebSocket server:', err);
    throw err;
  }
}

/**
 * Check if WebSocket server is initialized.
 */
export function isWebSocketInitialized(): boolean {
  return initialized;
}

/**
 * Get the Socket.IO server instance (after initialization).
 */
export function getWebSocketServer() {
  return socketManager.getIO();
}

// Export the socket manager for direct access
export { socketManager };
