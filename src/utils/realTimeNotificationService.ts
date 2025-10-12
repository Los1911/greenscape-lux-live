import { supabase } from '@/lib/supabase';

export interface HighValueActivity {
  id: string;
  type: 'quote_request' | 'hot_lead' | 'sales_milestone' | 'high_value_lead';
  title: string;
  description: string;
  priority: 'high' | 'urgent' | 'critical';
  value?: number;
  leadId?: string;
  userId?: string;
  timestamp: string;
  metadata?: any;
}

export interface NotificationChannel {
  type: 'browser' | 'email' | 'sms' | 'in_app';
  enabled: boolean;
  config?: any;
}

export class RealTimeNotificationService {
  private static instance: RealTimeNotificationService;
  private subscribers: Map<string, (activity: HighValueActivity) => void> = new Map();
  private channels: NotificationChannel[] = [];

  static getInstance(): RealTimeNotificationService {
    if (!RealTimeNotificationService.instance) {
      RealTimeNotificationService.instance = new RealTimeNotificationService();
    }
    return RealTimeNotificationService.instance;
  }

  constructor() {
    this.initializeChannels();
    this.setupRealtimeSubscriptions();
  }

  private initializeChannels() {
    this.channels = [
      { type: 'browser', enabled: true },
      { type: 'email', enabled: true },
      { type: 'in_app', enabled: true },
      { type: 'sms', enabled: false }
    ];
  }

  private setupRealtimeSubscriptions() {
    // Subscribe to quote requests
    supabase
      .channel('quote_requests_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'quote_requests'
      }, (payload) => {
        this.handleQuoteRequest(payload.new);
      })
      .subscribe();

    // Subscribe to lead status changes
    supabase
      .channel('leads_channel')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'leads',
        filter: 'status=eq.hot'
      }, (payload) => {
        this.handleHotLead(payload.new);
      })
      .subscribe();

    // Subscribe to sales milestones
    supabase
      .channel('sales_milestones_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sales_milestones'
      }, (payload) => {
        this.handleSalesMilestone(payload.new);
      })
      .subscribe();
  }

  private async handleQuoteRequest(quoteData: any) {
    const activity: HighValueActivity = {
      id: quoteData.id,
      type: 'quote_request',
      title: 'New High-Value Quote Request',
      description: `Quote request for ${quoteData.service_type} - $${quoteData.estimated_value?.toLocaleString()}`,
      priority: this.calculatePriority(quoteData.estimated_value),
      value: quoteData.estimated_value,
      timestamp: new Date().toISOString(),
      metadata: quoteData
    };

    await this.processActivity(activity);
  }

  private async handleHotLead(leadData: any) {
    const activity: HighValueActivity = {
      id: leadData.id,
      type: 'hot_lead',
      title: 'Lead Status Changed to HOT',
      description: `${leadData.name || 'Lead'} is now marked as a hot prospect`,
      priority: 'urgent',
      leadId: leadData.id,
      timestamp: new Date().toISOString(),
      metadata: leadData
    };

    await this.processActivity(activity);
  }

  private async handleSalesMilestone(milestoneData: any) {
    const activity: HighValueActivity = {
      id: milestoneData.id,
      type: 'sales_milestone',
      title: 'Sales Milestone Achieved',
      description: `${milestoneData.milestone_type} milestone reached: $${milestoneData.amount?.toLocaleString()}`,
      priority: 'high',
      value: milestoneData.amount,
      timestamp: new Date().toISOString(),
      metadata: milestoneData
    };

    await this.processActivity(activity);
  }

  private calculatePriority(value?: number): 'high' | 'urgent' | 'critical' {
    if (!value) return 'high';
    
    if (value >= 50000) return 'critical';
    if (value >= 10000) return 'urgent';
    return 'high';
  }

  private async processActivity(activity: HighValueActivity) {
    // Notify all subscribers
    this.subscribers.forEach(callback => callback(activity));

    // Send notifications through enabled channels
    await Promise.all(
      this.channels
        .filter(channel => channel.enabled)
        .map(channel => this.sendNotification(activity, channel))
    );

    // Store in database for history
    await this.storeActivity(activity);
  }

  private async sendNotification(activity: HighValueActivity, channel: NotificationChannel) {
    try {
      switch (channel.type) {
        case 'browser':
          await this.sendBrowserNotification(activity);
          break;
        case 'email':
          await this.sendEmailNotification(activity);
          break;
        case 'sms':
          await this.sendSMSNotification(activity);
          break;
        case 'in_app':
          await this.sendInAppNotification(activity);
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${channel.type} notification:`, error);
    }
  }

  private async sendBrowserNotification(activity: HighValueActivity) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(activity.title, {
        body: activity.description,
        icon: '/favicon.ico',
        tag: activity.id,
        requireInteraction: activity.priority === 'critical'
      });
    }
  }

  private async sendEmailNotification(activity: HighValueActivity) {
    await supabase.functions.invoke('send-notification', {
      body: {
        type: 'high_value_activity',
        activity,
        channel: 'email',
        recipients: await this.getSalesTeamEmails()
      }
    });
  }

  private async sendSMSNotification(activity: HighValueActivity) {
    await supabase.functions.invoke('send-notification', {
      body: {
        type: 'high_value_activity',
        activity,
        channel: 'sms',
        recipients: await this.getSalesTeamPhones()
      }
    });
  }

  private async sendInAppNotification(activity: HighValueActivity) {
    await supabase
      .from('notifications')
      .insert({
        type: activity.type,
        title: activity.title,
        message: activity.description,
        data: activity,
        priority: activity.priority,
        user_id: activity.userId || null,
        created_at: new Date().toISOString()
      });
  }

  private async storeActivity(activity: HighValueActivity) {
    await supabase
      .from('high_value_activities')
      .insert({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        priority: activity.priority,
        value: activity.value,
        lead_id: activity.leadId,
        user_id: activity.userId,
        metadata: activity.metadata,
        created_at: activity.timestamp
      });
  }

  private async getSalesTeamEmails(): Promise<string[]> {
    const { data } = await supabase
      .from('users')
      .select('email')
      .in('role', ['admin', 'sales', 'manager']);
    
    return data?.map(user => user.email) || [];
  }

  private async getSalesTeamPhones(): Promise<string[]> {
    const { data } = await supabase
      .from('user_profiles')
      .select('phone')
      .in('role', ['admin', 'sales', 'manager'])
      .not('phone', 'is', null);
    
    return data?.map(profile => profile.phone) || [];
  }

  // Public methods
  subscribe(id: string, callback: (activity: HighValueActivity) => void) {
    this.subscribers.set(id, callback);
    
    return () => {
      this.subscribers.delete(id);
    };
  }

  updateChannelConfig(channelType: string, enabled: boolean, config?: any) {
    const channel = this.channels.find(c => c.type === channelType);
    if (channel) {
      channel.enabled = enabled;
      if (config) {
        channel.config = config;
      }
    }
  }

  async triggerTestNotification(type: string) {
    const testActivity: HighValueActivity = {
      id: `test-${Date.now()}`,
      type: 'quote_request',
      title: `Test ${type} Notification`,
      description: `This is a test notification for ${type} alerts`,
      priority: 'high',
      value: 15000,
      timestamp: new Date().toISOString()
    };

    await this.processActivity(testActivity);
  }
}

export const notificationService = RealTimeNotificationService.getInstance();