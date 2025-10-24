import { supabase } from '../lib/supabase';

export interface EnvironmentVariable {
  key: string;
  value: string;
  source: 'local' | 'vercel' | 'supabase';
  lastUpdated: Date;
  isRequired: boolean;
  isValid: boolean;
}

export interface SyncResult {
  success: boolean;
  synced: string[];
  failed: Array<{ key: string; error: string }>;
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
  mismatches: Array<{
    key: string;
    local?: string;
    vercel?: string;
    supabase?: string;
  }>;
}

export class EnvironmentSyncService {
  private requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY', 
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_GOOGLE_MAPS_API_KEY'
  ];

  private supabaseSecrets = [
    'RESEND_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  async validateEnvironments(): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      missing: [],
      invalid: [],
      warnings: [],
      mismatches: []
    };

    // Get environment variables from different sources
    const localEnv = this.getLocalEnvironment();
    const vercelEnv = await this.getVercelEnvironment();
    const supabaseEnv = await this.getSupabaseSecrets();

    // Check required variables
    for (const varName of this.requiredVars) {
      const localValue = localEnv[varName];
      const vercelValue = vercelEnv[varName];

      if (!localValue) {
        result.missing.push(`${varName} (local)`);
        result.valid = false;
      }

      if (!vercelValue) {
        result.missing.push(`${varName} (vercel)`);
        result.valid = false;
      }

      if (localValue && vercelValue && localValue !== vercelValue) {
        result.mismatches.push({
          key: varName,
          local: localValue,
          vercel: vercelValue
        });
        result.valid = false;
      }

      // Validate Stripe key format
      if (varName === 'VITE_STRIPE_PUBLISHABLE_KEY' && localValue) {
        if (!localValue.startsWith('pk_')) {
          result.invalid.push(`${varName}: Invalid format`);
          result.valid = false;
        } else if (localValue.startsWith('pk_live_')) {
          result.warnings.push(`${varName}: Using LIVE key`);
        }
      }
    }

    // Check Supabase secrets
    for (const secretName of this.supabaseSecrets) {
      const supabaseValue = supabaseEnv[secretName];
      if (!supabaseValue) {
        result.missing.push(`${secretName} (supabase)`);
        result.valid = false;
      }
    }

    return result;
  }

  async syncToVercel(variables: Record<string, string>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      synced: [],
      failed: [],
      warnings: []
    };

    const vercelToken = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!vercelToken || !projectId) {
      result.failed.push({
        key: 'VERCEL_CONFIG',
        error: 'Missing VERCEL_TOKEN or VERCEL_PROJECT_ID'
      });
      return result;
    }

    try {
      for (const [key, value] of Object.entries(variables)) {
        const response = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            key,
            value,
            type: 'encrypted',
            target: ['production', 'preview']
          })
        });

        if (response.ok) {
          result.synced.push(key);
        } else {
          const error = await response.text();
          result.failed.push({ key, error });
        }
      }

      result.success = result.failed.length === 0;
    } catch (error) {
      result.failed.push({
        key: 'SYNC_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return result;
  }

  async syncToSupabase(secrets: Record<string, string>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      synced: [],
      failed: [],
      warnings: []
    };

    try {
      // Note: Supabase secrets must be set manually in the dashboard
      // This method validates they exist
      const { data, error } = await supabase.functions.invoke('validate-secrets', {
        body: { secrets: Object.keys(secrets) }
      });

      if (error) {
        result.failed.push({
          key: 'SUPABASE_VALIDATION',
          error: error.message
        });
      } else {
        result.synced = Object.keys(secrets);
        result.success = true;
        result.warnings.push('Supabase secrets must be set manually in dashboard');
      }
    } catch (error) {
      result.failed.push({
        key: 'SUPABASE_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return result;
  }

  private getLocalEnvironment(): Record<string, string> {
    const env: Record<string, string> = {};
    
    // Get Vite environment variables
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        env[key] = import.meta.env[key];
      }
    });

    return env;
  }

  private async getVercelEnvironment(): Promise<Record<string, string>> {
    const env: Record<string, string> = {};
    const vercelToken = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!vercelToken || !projectId) {
      return env;
    }

    try {
      const response = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
        headers: {
          'Authorization': `Bearer ${vercelToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        data.envs?.forEach((envVar: any) => {
          if (envVar.key.startsWith('VITE_')) {
            env[envVar.key] = envVar.value;
          }
        });
      }
    } catch (error) {
      console.warn('Failed to fetch Vercel environment:', error);
    }

    return env;
  }

  private async getSupabaseSecrets(): Promise<Record<string, string>> {
    const secrets: Record<string, string> = {};

    try {
      // This would need to be implemented as an edge function
      // that checks if secrets exist (without exposing values)
      const { data } = await supabase.functions.invoke('check-secrets');
      return data?.secrets || {};
    } catch (error) {
      console.warn('Failed to check Supabase secrets:', error);
      return secrets;
    }
  }
}