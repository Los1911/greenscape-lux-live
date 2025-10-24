import { supabase } from '@/lib/supabase';

interface MonitoringConfig {
  failureThreshold: number;
  ipThreshold: number;
  rateLimitThreshold: number;
  checkInterval: number; // minutes
}

export class StripeKeyMonitor {
  private config: MonitoringConfig = {
    failureThreshold: 100,
    ipThreshold: 15,
    rateLimitThreshold: 10,
    checkInterval: 5
  };

  private monitoringActive = false;
  private intervalId: NodeJS.Timeout | null = null;

  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      console.log('Monitoring already active');
      return;
    }

    this.monitoringActive = true;
    console.log('Starting Stripe key monitoring...');

    this.intervalId = setInterval(async () => {
      await this.performSecurityCheck();
    }, this.config.checkInterval * 60 * 1000);

    // Perform initial check
    await this.performSecurityCheck();
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.monitoringActive = false;
    console.log('Stripe key monitoring stopped');
  }

  private async performSecurityCheck(): Promise<void> {
    try {
      const indicators = await this.detectCompromiseIndicators();
      
      if (indicators.length > 0) {
        await this.handleSecurityIncident(indicators);
      }

      // Log monitoring activity
      await this.logMonitoringActivity(indicators);
    } catch (error) {
      console.error('Security check failed:', error);
    }
  }

  private async detectCompromiseIndicators(): Promise<any[]> {
    const indicators = [];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
      // Check API logs for suspicious activity
      const { data: logs } = await supabase
        .from('stripe_api_logs')
        .select('*')
        .gte('created_at', twentyFourHoursAgo);

      if (!logs) return indicators;

      // Analyze failure rates
      const failedRequests = logs.filter(log => log.status >= 400);
      if (failedRequests.length > this.config.failureThreshold) {
        indicators.push({
          type: 'high_failure_rate',
          severity: failedRequests.length > this.config.failureThreshold * 2 ? 'critical' : 'high',
          count: failedRequests.length,
          details: {
            threshold: this.config.failureThreshold,
            timeframe: '24 hours'
          }
        });
      }

      // Check for unusual IP activity
      const uniqueIPs = new Set(logs.map(log => log.ip_address)).size;
      if (uniqueIPs > this.config.ipThreshold) {
        indicators.push({
          type: 'unusual_ip_activity',
          severity: uniqueIPs > this.config.ipThreshold * 2 ? 'high' : 'medium',
          count: uniqueIPs,
          details: {
            threshold: this.config.ipThreshold,
            timeframe: '24 hours'
          }
        });
      }

      // Check rate limiting hits
      const rateLimitHits = logs.filter(log => log.status === 429);
      if (rateLimitHits.length > this.config.rateLimitThreshold) {
        indicators.push({
          type: 'rate_limit_exceeded',
          severity: 'medium',
          count: rateLimitHits.length,
          details: {
            threshold: this.config.rateLimitThreshold,
            timeframe: '24 hours'
          }
        });
      }

      // Check for geographic anomalies
      const locations = logs.map(log => log.ip_location).filter(Boolean);
      const uniqueCountries = new Set(locations.map(loc => loc.split(',').pop()?.trim())).size;
      
      if (uniqueCountries > 5) {
        indicators.push({
          type: 'geographic_anomaly',
          severity: uniqueCountries > 10 ? 'high' : 'medium',
          count: uniqueCountries,
          details: {
            countries: Array.from(new Set(locations.map(loc => loc.split(',').pop()?.trim()))),
            timeframe: '24 hours'
          }
        });
      }

    } catch (error) {
      console.error('Error detecting compromise indicators:', error);
    }

    return indicators;
  }

  private async handleSecurityIncident(indicators: any[]): Promise<void> {
    const criticalIndicators = indicators.filter(i => i.severity === 'critical');
    const highSeverityIndicators = indicators.filter(i => i.severity === 'high');

    // Log all indicators
    for (const indicator of indicators) {
      await supabase.from('stripe_compromise_alerts').insert({
        alert_type: indicator.type,
        severity: indicator.severity,
        details: indicator,
        resolved: false
      });
    }

    // Auto-rotate keys for critical incidents
    if (criticalIndicators.length > 0) {
      console.log('Critical security incident detected, initiating automatic key rotation');
      await this.initiateKeyRotation('Automated: Critical security incident detected');
    } else if (highSeverityIndicators.length >= 2) {
      console.log('Multiple high-severity incidents detected, initiating automatic key rotation');
      await this.initiateKeyRotation('Automated: Multiple high-severity security incidents');
    }

    // Send notifications
    await this.sendSecurityAlert(indicators);
  }

  private async initiateKeyRotation(reason: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-key-rotation-manager', {
        body: {
          action: 'rotate_keys',
          reason,
          environment: process.env.NODE_ENV || 'production'
        }
      });

      if (error) {
        console.error('Key rotation failed:', error);
        await this.logRotationFailure(reason, error.message);
      } else {
        console.log('Key rotation successful:', data);
      }
    } catch (error) {
      console.error('Key rotation error:', error);
      await this.logRotationFailure(reason, String(error));
    }
  }

  private async sendSecurityAlert(indicators: any[]): Promise<void> {
    const criticalCount = indicators.filter(i => i.severity === 'critical').length;
    const highCount = indicators.filter(i => i.severity === 'high').length;

    await supabase.functions.invoke('send-admin-notification', {
      body: {
        type: 'security_alert',
        subject: `Stripe Security Alert - ${criticalCount} Critical, ${highCount} High Severity`,
        message: 'Suspicious activity detected on Stripe API keys',
        details: {
          indicators,
          total_alerts: indicators.length,
          critical_count: criticalCount,
          high_count: highCount,
          timestamp: new Date().toISOString()
        }
      }
    });
  }

  private async logMonitoringActivity(indicators: any[]): Promise<void> {
    // Log monitoring check (could be used for audit trail)
    console.log(`Security check completed: ${indicators.length} indicators found`);
  }

  private async logRotationFailure(reason: string, error: string): Promise<void> {
    await supabase.from('stripe_key_rotation_logs').insert({
      event_type: 'rotation_failed',
      old_key_hint: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '***' || 'unknown',
      new_key_hint: '',
      reason: `${reason} - Failed: ${error}`,
      environment: process.env.NODE_ENV || 'production'
    });
  }

  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Monitoring configuration updated:', this.config);
  }

  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  isMonitoring(): boolean {
    return this.monitoringActive;
  }
}

// Export singleton instance
export const stripeKeyMonitor = new StripeKeyMonitor();