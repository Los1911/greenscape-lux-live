import { supabase } from '@/lib/supabase'

/**
 * Triggers processing of pending Stripe Connect notifications
 * This is called after webhook updates to ensure emails are sent
 */
export async function triggerStripeConnectNotifications() {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-connect-notification', {
      body: {}
    })

    if (error) {
      console.error('Error triggering notifications:', error)
      return { success: false, error }
    }

    console.log('Notifications triggered:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Exception triggering notifications:', error)
    return { success: false, error }
  }
}

/**
 * Subscribes to real-time updates on stripe_connect_notifications table
 * Automatically triggers email processing when new notifications are queued
 */
export function subscribeToConnectNotifications(callback?: (payload: any) => void) {
  const channel = supabase
    .channel('stripe_connect_notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'stripe_connect_notifications',
        filter: 'processed=eq.false'
      },
      async (payload) => {
        console.log('New Stripe Connect notification queued:', payload)
        
        // Trigger notification processing
        await triggerStripeConnectNotifications()
        
        // Call optional callback
        if (callback) {
          callback(payload)
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Gets count of pending notifications
 */
export async function getPendingNotificationsCount() {
  try {
    const { data, error } = await supabase
      .from('stripe_connect_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('processed', false)

    if (error) throw error

    return { count: data || 0, error: null }
  } catch (error) {
    console.error('Error getting pending count:', error)
    return { count: 0, error }
  }
}
