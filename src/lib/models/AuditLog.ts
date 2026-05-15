import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  userId: string;
  userEmail: string;
  userRole: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  severity: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  action: { 
    type: String, 
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT']
  },
  entityType: { 
    type: String, 
    required: true,
    enum: ['STAFF', 'MENU', 'ORDER', 'INVENTORY', 'FEEDBACK']
  },
  entityId: { type: String, required: true },
  entityName: { type: String },
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userRole: { type: String, required: true },
  changes: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  description: { type: String },
  severity: { 
    type: String, 
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Add indexes for efficient searching
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ severity: 1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", auditLogSchema, "audit_logs");
