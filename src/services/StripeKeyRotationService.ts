import { supabase } from '@/lib/supabase';

interface KeyRotationEvent {
  id: string;
  event_type: 'rotation' | 'compromise_detected' | 'rotation_failed';
  old_key_hint: string;
  new_key_hint: string;
  timestamp: string;
  reason: string;
  environment: string;
}

interface CompromiseIndicator {
  type: 'unusual_usage' | 'failed_requests' | 'geographic_anomaly' | 'rate_limit_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: string;
}

export class StripeKeyRotationService {
  private static instance: StripeKeyRotationService;
  private rotationInProgress = false;
  private compromiseThreshold = {
    failed_requests: 100,
    unusual_locations: 5,
    rate_limit_hits: 10
  };

  static getInstance(): StripeKeyRotationService {
    if (!this.instance) {
      this.instance = new StripeKeyRotationService();
    }
    return this.instance;
  }

  async detectCompromise(): Promise<CompromiseIndicator[]> {
    const indicators: CompromiseIndicator[] = [];
    
    try {
      // Check for unusual API usage patterns
      const { data: logs } = await supabase
        .from('stripe_api_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (logs) {
        const failedRequests = logs.filter(log => log.status >= 400).length;
        if (failedRequests > this.compromiseThreshold.failed_requests) {
          indicators.push({
            type: 'failed_requests',
            severity: 'high',
            details: { count: failedRequests, threshold: this.compromiseThreshold.failed_requests },
            timestamp: new Date().toISOString()
          });
        }

        // Check for geographic anomalies
        const uniqueLocations = new Set(logs.map(log => log.ip_location)).size;
        if (uniqueLocations > this.compromiseThreshold.unusual_locations) {
          indicators.push({
            type: 'geographic_anomaly',
            severity: 'medium',
            details: { locations: uniqueLocations, threshold: this.compromiseThreshold.unusual_locations },
            timestamp: new Date().toISOString()
          });
        }
      }

      return indicators;
    } catch (error) {
      console.error('Error detecting compromise:', error);
      return [];
    }
  }

  async rotateKeys(reason: string): Promise<boolean> {
    if (this.rotationInProgress) {
      console.log('Key rotation already in progress');
      return false;
    }

    this.rotationInProgress = true;

    try {
      // Step 1: Generate new keys via Stripe API
      const newKeys = await this.generateNewStripeKeys();
      
      // Step 2: Update environment variables
      await this.updateEnvironmentVariables(newKeys);
      
      // Step 3: Log rotation event
      await this.logRotationEvent({
        event_type: 'rotation',
        old_key_hint: this.maskKey(process.env.STRIPE_SECRET_KEY || ''),
        new_key_hint: this.maskKey(newKeys.secret),
        reason,
        environment: process.env.NODE_ENV || 'development'
      });

      // Step 4: Notify administrators
      await this.notifyAdministrators(reason, newKeys);

      // Step 5: Verify new keys work
      await this.verifyNewKeys(newKeys);

      return true;
    } catch (error) {
      console.error('Key rotation failed:', error);
      await this.logRotationEvent({
        event_type: 'rotation_failed',
        old_key_hint: this.maskKey(process.env.STRIPE_SECRET_KEY || ''),
        new_key_hint: '',
        reason: `Failed: ${error}`,
        environment: process.env.NODE_ENV || 'development'
      });
      return false;
    } finally {
      this.rotationInProgress = false;
    }
  }

  private async generateNewStripeKeys(): Promise<{ publishable: string; secret: string }> {
    // This would integrate with Stripe's API to create new restricted keys
    // For now, we'll simulate the process
    const response = await fetch('https://api.stripe.com/v1/keys', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'type': 'restricted',
        'permissions[]': 'charges:write',
        'permissions[]': 'customers:write',
        'permissions[]': 'payment_intents:write'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate new Stripe keys');
    }

    const data = await response.json();
    return {
      publishable: data.publishable_key,
      secret: data.secret_key
    };
  }

  private async updateEnvironmentVariables(newKeys: { publishable: string; secret: string }): Promise<void> {
    // Update Supabase secrets
    await supabase.functions.invoke('update-environment-secrets', {
      body: {
        secrets: {
          STRIPE_PUBLISHABLE_KEY: newKeys.publishable,
          STRIPE_SECRET_KEY: newKeys.secret,
          VITE_STRIPE_PUBLISHABLE_KEY: newKeys.publishable
        }
      }
    });
  }

  private async logRotationEvent(event: Omit<KeyRotationEvent, 'id' | 'timestamp'>): Promise<void> {
    await supabase.from('stripe_key_rotation_logs').insert({
      ...event,
      timestamp: new Date().toISOString()
    });
  }

  private async notifyAdministrators(reason: string, newKeys: { publishable: string; secret: string }): Promise<void> {
    await supabase.functions.invoke('send-admin-notification', {
      body: {
        type: 'stripe_key_rotation',
        subject: 'Stripe Keys Rotated - Action Required',
        message: `Stripe API keys have been automatically rotated due to: ${reason}`,
        details: {
          reason,
          new_publishable_key_hint: this.maskKey(newKeys.publishable),
          timestamp: new Date().toISOString()
        }
      }
    });
  }

  private async verifyNewKeys(newKeys: { publishable: string; secret: string }): Promise<void> {
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${newKeys.secret}`
      }
    });

    if (!response.ok) {
      throw new Error('New keys verification failed');
    }
  }

  private maskKey(key: string): string {
    if (key.length < 8) return '***';
    return key.substring(0, 8) + '***' + key.substring(key.length - 4);
  }

  async startMonitoring(): Promise<void> {
    setInterval(async () => {
      const indicators = await this.detectCompromise();
      
      if (indicators.some(i => i.severity === 'critical' || i.severity === 'high')) {
        console.log('Compromise detected, initiating key rotation');
        await this.rotateKeys('Automated: Compromise detected');
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}