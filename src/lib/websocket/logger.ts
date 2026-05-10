/**
 * WebSocket Event Logger
 * 
 * Logs all important WebSocket events for audit trails and debugging.
 */

import { Server as WebSocketServer } from 'socket.io';
import EventLog from '../../models/EventLog';
import connectDB from '../db';

export function attachSocketLogging(io: WebSocketServer) {
  // We only attach ONE global listener to avoid terminal spam
  io.on('connection', (socket) => {
    const nsp = socket.nsp.name;
    const socketId = socket.id;
    const ip = socket.handshake.address;
    
    console.log(`[SERVER] New Connection | ID: ${socketId} | Namespace: ${nsp} | IP: ${ip} | Time: ${new Date().toISOString()}`);

    socket.on('disconnect', (_reason) => {
      console.log(`[SERVER] Disconnected | ID: ${socketId} | Namespace: ${nsp} | _reason: ${_reason} | Time: ${new Date().toISOString()}`);
      
      logEvent({
        timestamp: new Date(),
        namespace: nsp,
        socketId: socketId,
        eventType: 'disconnect',
        eventName: 'disconnect',
        data: { _reason }
      });
    });

    // Log the connection to DB
    logEvent({
      timestamp: new Date(),
      namespace: nsp,
      socketId: socketId,
      eventType: 'connect',
      eventName: 'connection',
      ipAddress: ip
    });
  });
}

async function logEvent(entry: unknown) {
  try {
    await connectDB();
    await EventLog.create(entry);
  } catch (_err) {
    // Silent fail for logging _errors
  }
}
