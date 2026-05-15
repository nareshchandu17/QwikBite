import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuditLog, IAuditLog } from '@/lib/models/AuditLog';

export interface AuditLogData {
  id?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT';
  entityType: 'STAFF' | 'MENU' | 'ORDER' | 'INVENTORY' | 'FEEDBACK';
  entityId: string;
  entityName?: string;
  userId: string;
  userEmail: string;
  userRole: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp?: Date;
}

export class AuditService {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await connectDB();
      
      const logEntry = {
        ...data,
        timestamp: data.timestamp || new Date(),
      };

      await (AuditLog as any).create(logEntry);

      console.log(`[AUDIT] ${data.action} ${data.entityType}:${data.entityId} by ${data.userEmail}`);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  static async logStaffAction(
    action: AuditLogData['action'],
    staffId: string,
    staffName: string,
    userId: string,
    userEmail: string,
    userRole: string,
    changes?: Record<string, unknown>,
    request?: NextRequest,
    description?: string
  ): Promise<void> {
    const ipAddress = request?.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request?.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request?.headers.get('user-agent') || 'unknown';

    return this.log({
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
  }

  static async getUserActivity(userId: string, limit: number = 50): Promise<IAuditLog[]> {
    try {
      await connectDB();
      return await (AuditLog as any).find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean() as unknown as IAuditLog[];
    } catch (error) {
      console.error('Failed to get user activity:', error);
      return [];
    }
  }

  static async getEntityHistory(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<IAuditLog[]> {
    try {
      await connectDB();
      return await (AuditLog as any).find({ entityType, entityId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean() as unknown as IAuditLog[];
    } catch (error) {
      console.error('Failed to get entity history:', error);
      return [];
    }
  }

  static async getSecurityLogs(
    severity: AuditLogData['severity'] = 'HIGH',
    limit: number = 100,
    hours: number = 24
  ): Promise<IAuditLog[]> {
    try {
      await connectDB();
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const minSeverityIndex = severityLevels.indexOf(severity);
      const targetSeverities = severityLevels.slice(minSeverityIndex);
      
      return await (AuditLog as any).find({
        severity: { $in: targetSeverities },
        timestamp: { $gte: since }
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean() as unknown as IAuditLog[];
    } catch (error) {
      console.error('Failed to get security logs:', error);
      return [];
    }
  }

  static async getStatistics(days: number = 30): Promise<unknown> {
    try {
      await connectDB();
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const stats = await AuditLog.aggregate([
        { $match: { timestamp: { $gte: since } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byAction: { $push: '$action' },
            byEntityType: { $push: '$entityType' },
            bySeverity: { $push: '$severity' },
            byUser: { $push: '$userEmail' }
          }
        }
      ]);

      if (stats.length === 0) return { total: 0 };

      // Helper to count occurrences in an array
      const countOccurrences = (arr: string[]) => {
        return arr.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      };

      const result = stats[0];
      return {
        total: result.total,
        byAction: countOccurrences(result.byAction),
        byEntityType: countOccurrences(result.byEntityType),
        bySeverity: countOccurrences(result.bySeverity),
        byUser: countOccurrences(result.byUser)
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return { total: 0 };
    }
  }

  static async getAllLogs(limit: number = 100): Promise<IAuditLog[]> {
    try {
      await connectDB();
      return await (AuditLog as any).find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean() as unknown as IAuditLog[];
    } catch (error) {
      console.error('Failed to get all logs:', error);
      return [];
    }
  }

  static async clearLogs(): Promise<void> {
    try {
      await connectDB();
      await (AuditLog as any).deleteMany({});
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}

export default AuditService;
