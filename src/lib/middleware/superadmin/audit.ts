import { db } from '$lib/server/db';
import { auditLogs } from '$lib/db/drizzle/schema';

/**
 * Log a Super Admin action for auditing purposes
 */
export async function logSuperAdminAction({
  userId,
  action,
  workspaceId = null,
  details = {},
  ipAddress = null
}: {
  userId: string;
  action: string;
  workspaceId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
}) {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      workspaceId,
      details,
      ipAddress,
      timestamp: new Date()
    });
    
    console.log(`Audit log created for action: ${action} by user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return false;
  }
}