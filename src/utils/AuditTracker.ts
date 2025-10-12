import { supabase } from '@/lib/supabase';

export type AuditLogType =
  | 'login_success'
  | 'login_failed'
  | 'logout_success'
  | 'signup_success'
  | 'signup_failed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'quote_submitted'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'job_created'
  | 'job_completed'
  | 'job_cancelled'
  | 'payment_success'
  | 'payment_failed'
  | 'profile_updated'
  | 'document_uploaded'
  | 'admin_action'
  | 'security_event'
  | 'system_error';

export interface AuditLogDetails {
  [key: string]: any;
}

/**
 * Logs an audit event to the system_audit_logs table
 * @param type - The type of audit event
 * @param userId - The user ID (optional, will use current user if not provided)
 * @param details - Additional details about the event (optional)
 */
export async function logAuditEvent(
  type: AuditLogType,
  userId?: string,
  details?: AuditLogDetails
): Promise<void> {
  try {
    // Get current user if userId not provided
    let finalUserId = userId;
    if (!finalUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      finalUserId = user?.id;
    }

    const { error } = await supabase
      .from('system_audit_logs')
      .insert({
        type,
        user_id: finalUserId,
        details: details || null,
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Error logging audit event:', err);
  }
}

/**
 * Retrieves audit logs with optional filters
 * @param filters - Optional filters for type, userId, startDate, endDate
 * @param limit - Maximum number of logs to retrieve (default: 100)
 */
export async function getAuditLogs(
  filters?: {
    type?: AuditLogType;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limit: number = 100
) {
  try {
    let query = supabase
      .from('system_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error retrieving audit logs:', err);
    return [];
  }
}
