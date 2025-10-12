import { supabase } from '../lib/supabase'

export interface NotificationData {
  userId: string
  type: 'payout_success' | 'payout_failed' | 'payout_processing' | 'payout_retry' | 'payout_cancelled'
  title: string
  message: string
  data?: {
    payout_id?: string
    amount?: number
    stripe_transfer_id?: string
    error_message?: string
    retry_count?: number
    next_retry?: string
  }
  email?: string
}

export class NotificationService {
  static async sendPayoutNotification(notification: NotificationData) {
    try {
      const { error } = await supabase.functions.invoke('send-payout-notification', {
        body: notification
      })

      if (error) {
        console.error('Failed to send payout notification:', error)
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Error in notification service:', error)
      return { success: false, error }
    }
  }

  static async sendPayoutSuccessNotification(
    userId: string,
    email: string,
    amount: number,
    payoutId: string,
    stripeTransferId?: string
  ) {
    return this.sendPayoutNotification({
      userId,
      email,
      type: 'payout_success',
      title: 'Payout Completed Successfully',
      message: `Your payout of $${amount} has been processed and sent to your account.`,
      data: {
        payout_id: payoutId,
        amount,
        stripe_transfer_id: stripeTransferId
      }
    })
  }

  static async sendPayoutFailedNotification(
    userId: string,
    email: string,
    amount: number,
    payoutId: string,
    errorMessage: string
  ) {
    return this.sendPayoutNotification({
      userId,
      email,
      type: 'payout_failed',
      title: 'Payout Failed',
      message: `Your payout of $${amount} could not be processed. Please check your payment details.`,
      data: {
        payout_id: payoutId,
        amount,
        error_message: errorMessage
      }
    })
  }

  static async sendPayoutProcessingNotification(
    userId: string,
    email: string,
    amount: number,
    payoutId: string
  ) {
    return this.sendPayoutNotification({
      userId,
      email,
      type: 'payout_processing',
      title: 'Payout Being Processed',
      message: `Your payout of $${amount} is currently being processed and will arrive in 1-2 business days.`,
      data: {
        payout_id: payoutId,
        amount
      }
    })
  }

  static async sendPayoutRetryNotification(
    userId: string,
    email: string,
    amount: number,
    payoutId: string,
    retryCount: number,
    nextRetry: string
  ) {
    return this.sendPayoutNotification({
      userId,
      email,
      type: 'payout_retry',
      title: 'Payout Retry Scheduled',
      message: `Your payout of $${amount} failed but will be retried automatically on ${new Date(nextRetry).toLocaleDateString()}.`,
      data: {
        payout_id: payoutId,
        amount,
        retry_count: retryCount,
        next_retry: nextRetry
      }
    })
  }

  // Admin notifications
  static async sendAdminPayoutAlert(
    adminUserId: string,
    adminEmail: string,
    landscaperName: string,
    amount: number,
    status: 'failed' | 'retry_exhausted',
    payoutId: string
  ) {
    const titles = {
      failed: 'Payout Failed - Admin Attention Required',
      retry_exhausted: 'Payout Retries Exhausted - Manual Intervention Needed'
    }

    const messages = {
      failed: `Payout to ${landscaperName} ($${amount}) has failed and requires admin review.`,
      retry_exhausted: `Payout to ${landscaperName} ($${amount}) has exhausted all retry attempts and needs manual processing.`
    }

    return this.sendPayoutNotification({
      userId: adminUserId,
      email: adminEmail,
      type: 'payout_failed',
      title: titles[status],
      message: messages[status],
      data: {
        payout_id: payoutId,
        amount,
        landscaper_name: landscaperName
      }
    })
  }

  // Bulk notification for admin dashboard
  static async getRecentNotifications(userId: string, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  static async markNotificationAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)

      return { success: !error, error }
    } catch (error) {
      return { success: false, error }
    }
  }

  static async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      return { count: count || 0, error }
    } catch (error) {
      return { count: 0, error }
    }
  }
}