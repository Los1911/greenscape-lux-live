import { supabase } from '../lib/supabase';

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationRule {
  id: string;
  name: string;
  eventType: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  recipients: string[];
  templateId: string;
  escalationMinutes: number;
  cooldownMinutes: number;
}

export interface PaymentEvent {
  type: 'payment_failed' | 'webhook_failed' | 'system_down' | 'high_refund_rate' | 'commission_payout_failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PaymentNotificationService {
  private static instance: PaymentNotificationService;
  private alertCooldowns = new Map<string, Date>();
  private escalationTimers = new Map<string, NodeJS.Timeout>();

  static getInstance(): PaymentNotificationService {
    if (!PaymentNotificationService.instance) {
      PaymentNotificationService.instance = new PaymentNotificationService();
    }
    return PaymentNotificationService.instance;
  }

  async processEvent(event: PaymentEvent): Promise<void> {
    try {
      const rules = await this.getActiveRules(event.type);
      
      for (const rule of rules) {
        if (await this.shouldTriggerAlert(rule, event)) {
          await this.sendAlert(rule, event);
          this.scheduleEscalation(rule, event);
        }
      }
    } catch (error) {
      console.error('Error processing payment event:', error);
    }
  }

  private async getActiveRules(eventType: string): Promise<NotificationRule[]> {
    const { data, error } = await supabase
      .from('notification_rules')
      .select('*')
      .eq('event_type', eventType)
      .eq('enabled', true);

    if (error) {
      console.error('Error fetching notification rules:', error);
      return [];
    }

    return data || [];
  }

  private async shouldTriggerAlert(rule: NotificationRule, event: PaymentEvent): Promise<boolean> {
    // Check cooldown
    const cooldownKey = `${rule.id}_${event.type}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey);
    
    if (lastAlert) {
      const cooldownEnd = new Date(lastAlert.getTime() + rule.cooldownMinutes * 60000);
      if (new Date() < cooldownEnd) {
        return false;
      }
    }

    // Evaluate condition
    return this.evaluateCondition(rule.condition, event, rule.threshold);
  }

  private evaluateCondition(condition: string, event: PaymentEvent, threshold: number): boolean {
    // Simple condition evaluation - in production, use a proper expression evaluator
    switch (condition) {
      case 'failed_payments_count > threshold':
        return (event.data.failedCount || 0) > threshold;
      case 'webhook_failures > threshold':
        return (event.data.webhookFailures || 0) > threshold;
      case 'system_downtime > threshold':
        return (event.data.downtimeMinutes || 0) > threshold;
      case 'refund_rate > threshold':
        return (event.data.refundRate || 0) > threshold;
      default:
        return false;
    }
  }

  private async sendAlert(rule: NotificationRule, event: PaymentEvent): Promise<void> {
    try {
      const template = await this.getTemplate(rule.templateId);
      if (!template) return;

      const emailContent = this.renderTemplate(template, event);
      
      // Send via Supabase Edge Function
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          recipients: rule.recipients,
          subject: emailContent.subject,
          htmlContent: emailContent.html,
          textContent: emailContent.text,
          priority: this.getPriority(event.severity)
        }
      });

      if (error) {
        console.error('Error sending notification:', error);
      } else {
        // Record successful send and set cooldown
        const cooldownKey = `${rule.id}_${event.type}`;
        this.alertCooldowns.set(cooldownKey, new Date());
        
        await this.logNotification(rule, event, 'sent');
      }
    } catch (error) {
      console.error('Error in sendAlert:', error);
    }
  }

  private async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return data;
  }

  private renderTemplate(template: NotificationTemplate, event: PaymentEvent): {
    subject: string;
    html: string;
    text: string;
  } {
    const variables = {
      ...event.data,
      timestamp: event.timestamp.toISOString(),
      severity: event.severity,
      type: event.type
    };

    return {
      subject: this.replaceVariables(template.subject, variables),
      html: this.replaceVariables(template.htmlContent, variables),
      text: this.replaceVariables(template.textContent, variables)
    };
  }

  private replaceVariables(content: string, variables: Record<string, any>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key]?.toString() || match;
    });
  }

  private getPriority(severity: string): 'low' | 'normal' | 'high' {
    switch (severity) {
      case 'critical': return 'high';
      case 'high': return 'high';
      case 'medium': return 'normal';
      default: return 'low';
    }
  }

  private scheduleEscalation(rule: NotificationRule, event: PaymentEvent): void {
    const escalationKey = `${rule.id}_${event.type}_${Date.now()}`;
    
    const timer = setTimeout(async () => {
      await this.escalateAlert(rule, event);
      this.escalationTimers.delete(escalationKey);
    }, rule.escalationMinutes * 60000);

    this.escalationTimers.set(escalationKey, timer);
  }

  private async escalateAlert(rule: NotificationRule, event: PaymentEvent): Promise<void> {
    // Send escalation notification to additional recipients
    const escalationRecipients = ['admin.1@greenscapelux.com', 'cto@greenscapelux.com'];
    
    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        recipients: escalationRecipients,
        subject: `ESCALATED: ${event.type} - ${event.severity}`,
        htmlContent: `Alert escalated after ${rule.escalationMinutes} minutes without acknowledgment.`,
        textContent: `Alert escalated after ${rule.escalationMinutes} minutes without acknowledgment.`,
        priority: 'high'
      }
    });

    if (!error) {
      await this.logNotification(rule, event, 'escalated');
    }
  }

  private async logNotification(rule: NotificationRule, event: PaymentEvent, status: string): Promise<void> {
    await supabase.from('notification_logs').insert({
      rule_id: rule.id,
      event_type: event.type,
      severity: event.severity,
      status,
      timestamp: new Date().toISOString(),
      recipients: rule.recipients
    });
  }

  // Public methods for manual testing
  async testNotification(ruleId: string, testData: Record<string, any>): Promise<boolean> {
    const mockEvent: PaymentEvent = {
      type: 'payment_failed',
      severity: 'high',
      data: testData,
      timestamp: new Date()
    };

    try {
      await this.processEvent(mockEvent);
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }

  clearEscalations(): void {
    this.escalationTimers.forEach(timer => clearTimeout(timer));
    this.escalationTimers.clear();
  }
}

export const paymentNotificationService = PaymentNotificationService.getInstance();