// Automated Environment Variable Synchronization Service
import { EnvironmentSyncService } from './EnvironmentSyncService';

export interface SyncConfig {
  platforms: ('vercel' | 'netlify')[];
  autoSync: boolean;
  syncInterval: number; // minutes
  notificationChannels: ('slack' | 'email')[];
}

export interface SyncResult {
  platform: string;
  success: boolean;
  syncedVars: string[];
  errors: string[];
  timestamp: Date;
}

export interface ValidationResult {
  valid: boolean;
  missingVars: string[];
  invalidVars: string[];
  warnings: string[];
}

export class AutomatedEnvSyncService {
  private static instance: AutomatedEnvSyncService;
  private syncInterval?: NodeJS.Timeout;
  private config: SyncConfig = {
    platforms: ['vercel'],
    autoSync: false,
    syncInterval: 30,
    notificationChannels: ['slack']
  };

  static getInstance(): AutomatedEnvSyncService {
    if (!this.instance) {
      this.instance = new AutomatedEnvSyncService();
    }
    return this.instance;
  }

  async validateLocalEnvironment(): Promise<ValidationResult> {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_GOOGLE_MAPS_API_KEY',
      'RESEND_API_KEY'
    ];

    const missingVars: string[] = [];
    const invalidVars: string[] = [];
    const warnings: string[] = [];

    requiredVars.forEach(varName => {
      const value = import.meta.env[varName];
      
      if (!value || value === 'undefined') {
        missingVars.push(varName);
      } else if (value.includes('placeholder') || value.includes('your_')) {
        invalidVars.push(varName);
      } else if (varName === 'VITE_STRIPE_PUBLISHABLE_KEY' && !value.startsWith('pk_')) {
        warnings.push(`${varName}: Invalid Stripe key format`);
      }
    });

    return {
      valid: missingVars.length === 0 && invalidVars.length === 0,
      missingVars,
      invalidVars,
      warnings
    };
  }

  async syncToVercel(envVars: Record<string, string>): Promise<SyncResult> {
    const result: SyncResult = {
      platform: 'vercel',
      success: false,
      syncedVars: [],
      errors: [],
      timestamp: new Date()
    };

    try {
      const token = process.env.VERCEL_TOKEN;
      const projectId = process.env.VERCEL_PROJECT_ID;

      if (!token || !projectId) {
        result.errors.push('Missing VERCEL_TOKEN or VERCEL_PROJECT_ID');
        return result;
      }

      for (const [key, value] of Object.entries(envVars)) {
        try {
          await this.setVercelEnvVar(key, value, token, projectId);
          result.syncedVars.push(key);
        } catch (error) {
          result.errors.push(`Failed to sync ${key}: ${error}`);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`Vercel sync failed: ${error}`);
    }

    return result;
  }

  private async setVercelEnvVar(key: string, value: string, token: string, projectId: string): Promise<void> {
    const response = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key,
        value,
        type: 'encrypted',
        target: ['production', 'preview']
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  async syncToNetlify(envVars: Record<string, string>): Promise<SyncResult> {
    const result: SyncResult = {
      platform: 'netlify',
      success: false,
      syncedVars: [],
      errors: [],
      timestamp: new Date()
    };

    try {
      const token = process.env.NETLIFY_TOKEN;
      const siteId = process.env.NETLIFY_SITE_ID;

      if (!token || !siteId) {
        result.errors.push('Missing NETLIFY_TOKEN or NETLIFY_SITE_ID');
        return result;
      }

      const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          build_settings: {
            env: envVars
          }
        })
      });

      if (response.ok) {
        result.syncedVars = Object.keys(envVars);
        result.success = true;
      } else {
        result.errors.push(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      result.errors.push(`Netlify sync failed: ${error}`);
    }

    return result;
  }

  async performFullSync(): Promise<SyncResult[]> {
    const validation = await this.validateLocalEnvironment();
    
    if (!validation.valid) {
      throw new Error(`Environment validation failed: ${[...validation.missingVars, ...validation.invalidVars].join(', ')}`);
    }

    const envVars = this.getEnvironmentVariables();
    const results: SyncResult[] = [];

    for (const platform of this.config.platforms) {
      let result: SyncResult;
      
      if (platform === 'vercel') {
        result = await this.syncToVercel(envVars);
      } else if (platform === 'netlify') {
        result = await this.syncToNetlify(envVars);
      } else {
        continue;
      }
      
      results.push(result);
      
      if (!result.success) {
        await this.sendNotification('sync_failed', { platform, errors: result.errors });
      }
    }

    return results;
  }

  private getEnvironmentVariables(): Record<string, string> {
    const vars: Record<string, string> = {};
    
    // Get all VITE_ prefixed variables
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        vars[key] = import.meta.env[key];
      }
    });

    // Add server-side variables if available
    const serverVars = ['RESEND_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
    serverVars.forEach(key => {
      if (process.env[key]) {
        vars[key] = process.env[key];
      }
    });

    return vars;
  }

  private async sendNotification(type: string, data: any): Promise<void> {
    if (this.config.notificationChannels.includes('slack')) {
      await this.sendSlackNotification(type, data);
    }
    
    if (this.config.notificationChannels.includes('email')) {
      await this.sendEmailNotification(type, data);
    }
  }

  private async sendSlackNotification(type: string, data: any): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    const message = this.formatSlackMessage(type, data);
    
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  private formatSlackMessage(type: string, data: any): string {
    switch (type) {
      case 'sync_failed':
        return `🚨 Environment sync failed for ${data.platform}\nErrors: ${data.errors.join(', ')}`;
      case 'sync_success':
        return `✅ Environment sync successful for ${data.platform}\nSynced ${data.syncedVars.length} variables`;
      default:
        return `Environment sync notification: ${type}`;
    }
  }

  private async sendEmailNotification(type: string, data: any): Promise<void> {
    // Email notification implementation would go here
    console.log(`Email notification: ${type}`, data);
  }

  startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.config.autoSync = true;
    this.syncInterval = setInterval(async () => {
      try {
        await this.performFullSync();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, this.config.syncInterval * 60 * 1000);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    this.config.autoSync = false;
  }

  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.autoSync && !this.syncInterval) {
      this.startAutoSync();
    } else if (!this.config.autoSync && this.syncInterval) {
      this.stopAutoSync();
    }
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }
}