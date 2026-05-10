import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AuditService } from '@/lib/services/auditService';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null;

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const userId = searchParams.get('userId');
    const severity = searchParams.get('severity');

    let logs: unknown[] = [];

    if (entityType && entityId) {
      logs = await AuditService.getEntityHistory(entityType, entityId, limit);
    } else if (userId) {
      logs = await AuditService.getUserActivity(userId, limit);
    } else if (severity && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity)) {
      logs = await AuditService.getSecurityLogs(severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', limit);
    } else {
      logs = await AuditService.getAllLogs(limit);
    }

    const stats = await AuditService.getStatistics(30);

    return NextResponse.json({
      success: true,
      data: logs,
      stats
    });
  } catch (error: unknown) {
    console.error('Audit API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { role?: string } } | null;

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    await AuditService.clearLogs();

    return NextResponse.json({
      success: true,
      message: 'Audit logs cleared successfully'
    });
  } catch (error: unknown) {
    console.error('Audit API DELETE Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

