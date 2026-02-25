import { supabase } from '@/lib/supabase';
import { EnvKeySyncer } from '@/utils/envKeySyncer';

export interface SyncAlert {
  id: string;
  type: 'missing' | 'outdated' | 'error';
  platform: string;
  variable: string;
  message: string;
  timestamp: string;
}

export class AutomatedEnvSyncService {
  private syncer: EnvKeySyncer;
  private checkInterval: number = 300000; // 5 minutes
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.syncer = new EnvKeySyncer();
  }

  startAutomatedSync() {
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
    
    // Perform initial check
    this.performHealthCheck();
  }

  stopAutomatedSync() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async performHealthCheck(): Promise<SyncAlert[]> {
    const alerts: SyncAlert[] = [];
    
    try {
      // Check required environment variables
      const requiredVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_PUBLISHABLE_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'GOOGLE_MAPS_API_KEY'
      ];

      for (const varName of requiredVars) {
        const value = import.meta.env[varName];
        
        if (!value || value === 'undefined') {
          alerts.push({
            id: `missing-${varName}`,
            type: 'missing',
            platform: 'current',
            variable: varName,
            message: `Missing environment variable: ${varName}`,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Check sync status from database
      const { data: syncData } = await supabase
        .from('environment_variables')
        .select('*')
        .eq('status', 'error')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (syncData) {
        syncData.forEach(record => {
          alerts.push({
            id: record.id,
            type: 'error',
            platform: record.platform,
            variable: record.key,
            message: record.error || 'Sync error',
            timestamp: record.updated_at
          });
        });
      }

      // Store alerts
      if (alerts.length > 0) {
        await this.storeAlerts(alerts);
      }

    } catch (error) {
      console.error('Health check failed:', error);
    }

    return alerts;
  }

  async getActiveAlerts(): Promise<SyncAlert[]> {
    try {
      const { data } = await supabase
        .from('environment_variables')
        .select('*')
        .in('status', ['error', 'missing'])
        .order('updated_at', { ascending: false });

      return data?.map(record => ({
        id: record.id,
        type: record.status as 'missing' | 'outdated' | 'error',
        platform: record.platform,
        variable: record.key,
        message: record.error || 'Unknown error',
        timestamp: record.updated_at
      })) || [];
    } catch (error) {
      console.error('Failed to get alerts:', error);
      return [];
    }
  }

  private async storeAlerts(alerts: SyncAlert[]): Promise<void> {
    try {
      for (const alert of alerts) {
        await supabase.from('environment_variables').upsert({
          platform: alert.platform,
          key: alert.variable,
          status: alert.type,
          error: alert.message,
          updated_at: alert.timestamp
        }, {
          onConflict: 'platform,key'
        });
      }
    } catch (error) {
      console.error('Failed to store alerts:', error);
    }
  }

  async syncVariable(
    key: string,
    value: string,
    platforms: string[]
  ): Promise<{ success: boolean; errors: string[] }> {
    return this.syncer.syncEnvironmentVariable(key, value, platforms);
  }

  async syncAllVariables(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const variables = [
      { key: 'VITE_SUPABASE_URL', value: import.meta.env.VITE_SUPABASE_URL },
      { key: 'VITE_SUPABASE_PUBLISHABLE_KEY', value: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      { key: 'STRIPE_PUBLISHABLE_KEY', value: import.meta.env.STRIPE_PUBLISHABLE_KEY },
      { key: 'GOOGLE_MAPS_API_KEY', value: import.meta.env.GOOGLE_MAPS_API_KEY }
    ];

    const platforms = ['deploypad', 'vercel', 'github'];
    const errors: string[] = [];
    let synced = 0;

    for (const variable of variables) {
      if (variable.value) {
        const result = await this.syncVariable(variable.key, variable.value, platforms);
        if (result.success) {
          synced++;
        } else {
          errors.push(...result.errors);
        }
      }
    }

    return {
      success: errors.length === 0,
      synced,
      errors
    };
  }
}
