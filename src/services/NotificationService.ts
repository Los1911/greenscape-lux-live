import { supabase } from '@/lib/supabase';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(params: CreateNotificationParams) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create job assignment notification
   */
  static async notifyJobAssigned(userId: string, jobId: string, jobTitle: string) {
    return this.createNotification({
      userId,
      type: 'job_assigned',
      title: '🎯 New Job Assigned',
      message: `You have been assigned to: ${jobTitle}`,
      data: { job_id: jobId, job_title: jobTitle }
    });
  }

  /**
   * Create job completion notification
   */
  static async notifyJobCompleted(userId: string, jobId: string, amount: number) {
    return this.createNotification({
      userId,
      type: 'job_completed',
      title: '✅ Job Completed',
      message: `Job completed successfully. Payment of $${amount} is being processed.`,
      data: { job_id: jobId, amount }
    });
  }

  /**
   * Notify client when landscaper accepts their job
   */
  static async notifyJobAccepted(
    clientId: string, 
    jobId: string, 
    jobTitle: string, 
    landscaperName: string
  ) {
    return this.createNotification({
      userId: clientId,
      type: 'job_accepted',
      title: '✅ Job Accepted!',
      message: `${landscaperName} has accepted your job: ${jobTitle}`,
      data: { job_id: jobId, job_title: jobTitle, landscaper_name: landscaperName }
    });
  }

  /**
   * Notify landscaper when new job is posted in their area
   */
  static async notifyNewJobPosted(
    landscaperId: string, 
    jobId: string, 
    jobTitle: string, 
    location: string
  ) {
    return this.createNotification({
      userId: landscaperId,
      type: 'new_job_available',
      title: '🎯 New Job Available',
      message: `New job in ${location}: ${jobTitle}`,
      data: { job_id: jobId, job_title: jobTitle, location }
    });
  }


  /**
   * Create payment received notification
   */
  static async notifyPaymentReceived(userId: string, amount: number, paymentId: string) {
    return this.createNotification({
      userId,
      type: 'payment_received',
      title: '💰 Payment Received',
      message: `You received a payment of $${amount.toFixed(2)}`,
      data: { amount, payment_id: paymentId }
    });
  }

  /**
   * Create payment failed notification
   */
  static async notifyPaymentFailed(userId: string, amount: number, reason: string) {
    return this.createNotification({
      userId,
      type: 'payment_failed',
      title: '❌ Payment Failed',
      message: `Payment of $${amount.toFixed(2)} failed: ${reason}`,
      data: { amount, reason }
    });
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}
