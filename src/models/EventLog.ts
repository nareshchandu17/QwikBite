/**
 * EventLog Model
 * 
 * Stores WebSocket event audit logs for compliance and debugging.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IEventLog extends Document {
  timestamp: Date;
  namespace: string;
  socketId: string;
  userId?: string;
  eventType: 'connect' | 'disconnect' | 'message' | 'error';
  eventName: string;
  data?: unknown;
  ipAddress?: string;
  createdAt: Date;
}

const EventLogSchema = new Schema<IEventLog>(
  {
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    namespace: {
      type: String,
      required: true,
      index: true,
    },
    socketId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ['connect', 'disconnect', 'message', 'error'],
      index: true,
    },
    eventName: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'event_logs',
  }
);

// Create TTL index to auto-delete after 30 days
EventLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Create compound index for common queries
EventLogSchema.index({ userId: 1, timestamp: -1 });
EventLogSchema.index({ namespace: 1, timestamp: -1 });
EventLogSchema.index({ eventType: 1, timestamp: -1 });

const EventLog =
  mongoose.models.EventLog ||
  mongoose.model<IEventLog>('EventLog', EventLogSchema);

export default EventLog;
