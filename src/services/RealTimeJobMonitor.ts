import { supabase } from '@/lib/supabase';
import { NotificationService } from './NotificationService';

/**
 * Real-time monitoring service for quote requests and job assignments
 * Automatically notifies landscapers of new jobs in their service area
 */
export class RealTimeJobMonitor {
  private quoteChannel: any = null;
  private jobChannel: any = null;

  /**
   * Start monitoring for a landscaper
   */
  async startLandscaperMonitoring(landscaperId: string) {
    // Get landscaper's service areas
    const { data: profile } = await supabase
      .from('profiles')
      .select('service_areas, city, state')
      .eq('id', landscaperId)
      .single();

    if (!profile) return;

    // Monitor new quote requests
    this.quoteChannel = supabase
      .channel('quote-requests-monitor')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'quote_requests'
      }, async (payload) => {
        const quote = payload.new as any;
        
        // Check if quote matches landscaper's service area
        if (this.matchesServiceArea(quote, profile)) {
          await NotificationService.createNotification({
            userId: landscaperId,
            type: 'new_quote_request',
            title: '🎯 New Quote Request',
            message: `New ${quote.service_type} request in ${quote.city}`,
            data: { 
              quote_id: quote.id,
              service_type: quote.service_type,
              location: `${quote.city}, ${quote.state}`
            }
          });
        }
      })
      .subscribe();

    // Monitor job assignments
    this.jobChannel = supabase
      .channel('job-assignments-monitor')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'landscaper_jobs',
        filter: `landscaper_id=eq.${landscaperId}`
      }, async (payload) => {
        const job = payload.new as any;
        
        await NotificationService.createNotification({
          userId: landscaperId,
          type: 'job_assigned',
          title: '✅ Job Assigned',
          message: `You've been assigned a new job`,
          data: { job_id: job.id }
        });
      })
      .subscribe();
  }

  /**
   * Start monitoring for a client
   */
  async startClientMonitoring(clientId: string) {
    // Monitor quote request updates
    this.quoteChannel = supabase
      .channel('client-quotes-monitor')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'quote_requests',
        filter: `user_id=eq.${clientId}`
      }, async (payload) => {
        const quote = payload.new as any;
        
        if (quote.status === 'reviewed') {
          await NotificationService.createNotification({
            userId: clientId,
            type: 'quote_reviewed',
            title: '📋 Quote Reviewed',
            message: `Your ${quote.service_type} quote has been reviewed`,
            data: { quote_id: quote.id }
          });
        }
      })
      .subscribe();
  }

  /**
   * Check if quote matches landscaper's service area
   */
  private matchesServiceArea(quote: any, profile: any): boolean {
    // Match by city/state
    if (quote.city && profile.city && quote.state && profile.state) {
      return quote.city.toLowerCase() === profile.city.toLowerCase() &&
             quote.state.toLowerCase() === profile.state.toLowerCase();
    }
    return false;
  }

  /**
   * Stop all monitoring
   */
  stopMonitoring() {
    if (this.quoteChannel) {
      this.quoteChannel.unsubscribe();
      this.quoteChannel = null;
    }
    if (this.jobChannel) {
      this.jobChannel.unsubscribe();
      this.jobChannel = null;
    }
  }
}
