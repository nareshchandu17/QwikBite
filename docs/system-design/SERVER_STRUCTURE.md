# Server Structure Documentation

## Overview

This document explains the new server structure that integrates WebSocket and MongoDB functionality directly into the Next.js application for a production-level deployment.

## Directory Structure

```
src/
├── server/
│   ├── index.ts          # Main server entry point
│   ├── websocket/
│   │   └── server.ts     # WebSocket server implementation
│   ├── db/
│   │   └── mongodb.ts    # MongoDB service
│   └── utils/
│       └── [utility files]
├── app/
│   ├── api/
│   │   └── websocket/
│   │       └── route.ts  # HTTP API for WebSocket actions
│   └── [other app files]
└── [other src files]
```

## Key Components

### 1. Main Server (`src/server/index.ts`)

The main server file bootstraps both the Next.js application and the WebSocket server on the same HTTP server instance. This allows for a single deployment unit.

### 2. WebSocket Server (`src/server/websocket/server.ts`)

Implements real-time communication using Socket.IO with:
- Room-based order tracking
- Real-time order status updates
- Connection management

### 3. MongoDB Service (`src/server/db/mongodb.ts`)

A singleton service for MongoDB connections with:
- Connection management
- Database access utilities
- Error handling

### 4. HTTP API (`src/app/api/websocket/route.ts`)

Provides HTTP endpoints for WebSocket-related actions when needed.

## Running the Server

### Development Mode

```bash
# Run the Next.js development server with WebSocket support
npm run dev:server
```

Note: This will start the server using ts-node directly without building, which is suitable for development.

### Production Mode

For production, you would typically:

1. Build the Next.js application:
   ```bash
   npm run build
   ```

2. Run the built application:
   ```bash
   npm start
   ```

The WebSocket server functionality is integrated into the Next.js server, so it will run automatically when you start the Next.js application.

## Environment Variables

The server uses the following environment variables:

- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - Database name
- `PORT` - Server port (defaults to 4000)

## Migration from Separate Backend

Previously, the WebSocket server was in a separate `backend-prisma` directory. The new structure:

1. **Removes dependency on Prisma** - Uses direct MongoDB connections
2. **Integrates with Next.js** - Single deployment unit
3. **Maintains compatibility** - Existing WebSocket client code continues to work
4. **Simplifies deployment** - One server to manage instead of two

## Benefits

1. **Simplified Deployment** - Single server process
2. **Reduced Complexity** - Fewer moving parts
3. **Better Resource Utilization** - Shared HTTP server
4. **Easier Maintenance** - All code in one repository
5. **Consistent Environment** - Shared configuration and dependencies

## Usage

The WebSocket functionality is accessed the same way as before:

```typescript
import { websocketClient } from '@/lib/websocket';

// Connect to WebSocket server
websocketClient.connect('order-123');

// Listen for events
websocketClient.on('order_update', (data) => {
  console.log('Order updated:', data);
});

// Update order status
websocketClient.updateOrderStatus('order-123', 'Preparing');
```

## Future Improvements

1. Add authentication to WebSocket connections
2. Implement message queuing for reliability
3. Add monitoring and logging
4. Implement clustering for scalability