import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the Audit Log document
export interface IAuditLog extends Document {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT';
  entityType: 'STAFF' | 'MENU' | 'ORDER' | 'INVENTORY' | 'FEEDBACK';
  entityId: string;
  entityName?: string;
  userId: string;
  userEmail: string;
  userRole: string;
  changes?: Record<string, unknown>; // Before and after values
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  description?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Define the schema
const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'],
      index: true
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: ['STAFF', 'MENU', 'ORDER', 'INVENTORY', 'FEEDBACK'],
      index: true
    },
    entityId: {
      type: String,
      required: [true, 'Entity ID is required'],
      index: true
    },
    entityName: {
      type: String,
      trim: true
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      index: true
    },
    userRole: {
      type: String,
      required: [true, 'User role is required'],
      index: true
    },
    changes: {
      type: Schema.Types.Mixed,
      default: null
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'auditlogs'
  }
);

// Add compound indexes for common queries
auditLogSchema.index({ userId: 1, timestamp: -1 }); // For user activity logs
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 }); // For entity history
auditLogSchema.index({ action: 1, timestamp: -1 }); // For action-based filtering
auditLogSchema.index({ severity: 1, timestamp: -1 }); // For security monitoring
auditLogSchema.index({ timestamp: -1 }); // For recent logs


// TTL index to automatically delete logs older than 1 year
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Static method to create audit log
auditLogSchema.statics.createLog = async function(data: Partial<IAuditLog>) {
  return this.create({
    ...data,
    timestamp: new Date()
  });
};

// Static method to log staff actions
auditLogSchema.statics.logStaffAction = async function(
  action: IAuditLog['action'],
  staffId: string,
  staffName: string,
  userId: string,
  userEmail: string,
  userRole: string,
  changes?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string,
  description?: string
) {
  return this.create({
    action,
    entityType: 'STAFF',
    entityId: staffId,
    entityName: staffName,
    userId,
    userEmail,
    userRole,
    changes,
    ipAddress,
    userAgent,
    description,
    severity: action === 'DELETE' ? 'HIGH' : 'MEDIUM'
  });
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function(
  userId: string,
  limit: number = 50,
  skip: number = 0
) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('entityId', 'name email');
};

// Static method to get entity history
auditLogSchema.statics.getEntityHistory = function(
  entityType: string,
  entityId: string,
  limit: number = 50
) {
  return this.find({ entityType, entityId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get security logs
auditLogSchema.statics.getSecurityLogs = function(
  severity: IAuditLog['severity'] = 'HIGH',
  limit: number = 100,
  hours: number = 24
) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    severity: { $gte: severity },
    timestamp: { $gte: since }
  })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get audit statistics
auditLogSchema.statics.getStatistics = function(days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: {
          action: '$action',
          entityType: '$entityType',
          severity: '$severity'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        entityTypes: {
          $push: {
            entityType: '$_id.entityType',
            severity: '$_id.severity',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
};

// Create the model if it doesn't exist
export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
