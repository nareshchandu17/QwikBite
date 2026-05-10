import * as dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { validateEnv } from '../lib/env';
import { mongoDBService } from './db/mongodb';
import { socketManager } from '../lib/websocket/server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001; 
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Validate environment before starting
validateEnv();

app.prepare().then(async () => {
  // Connect to database
  try {
    await mongoDBService.connect();
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  const startTime = new Date().toISOString();
  console.log(`[SERVER START] ${startTime}`);

  const httpServer = createServer(async (req, res) => {
    try {
      // Add CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }

      // 🛡️ EXCLUDE SOCKET.IO FROM NEXT.JS HANDLER
      // This allows the socket server to handle its own handshake without interference
      if (req.url?.startsWith('/api/socket/io')) {
        return; 
      }

      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize WebSocket server using the centralized SocketManager
  await socketManager.initialize(httpServer);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server active at ws://${hostname}:${port}/api/socket/io`);
  });



  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });
});