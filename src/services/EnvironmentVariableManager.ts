import { supabase } from '@/lib/supabase';

export interface EnvironmentVariable {
  key: string;
  value: string;
  environment: 'development' | 'staging' | 'production';
  type: 'stripe_publishable' | 'stripe_secret' | 'stripe_webhook' | 'other';
  lastRotated?: string;
  isActive: boolean;
}

export interface KeyValidationResult {
  isValid: boolean;
  keyType: string;
  environment: string;
  errors: string[];
}

export class EnvironmentVariableManager {
  private static instance: EnvironmentVariableManager;
  
  static getInstance(): EnvironmentVariableManager {
    if (!this.instance) {
      this.instance = new EnvironmentVariableManager();
    }
    return this.instance;
  }

  async validateStripeKey(key: string): Promise<KeyValidationResult> {
    const result: KeyValidationResult = {
      isValid: false,
      keyType: 'unknown',
      environment: 'unknown',
      errors: []
    };

    if (!key || typeof key !== 'string') {
      result.errors.push('Key is required and must be a string');
      return result;
    }

    // Validate Stripe key format
    if (key.startsWith('pk_test_')) {
      result.keyType = 'publishable';
      result.environment = 'test';
    } else if (key.startsWith('pk_live_')) {
      result.keyType = 'publishable';
      result.environment = 'live';
    } else if (key.startsWith('sk_test_')) {
      result.keyType = 'secret';
      result.environment = 'test';
    } else if (key.startsWith('sk_live_')) {
      result.keyType = 'secret';
      result.environment = 'live';
    } else if (key.startsWith('whsec_')) {
      result.keyType = 'webhook';
      result.environment = 'both';
    } else {
      result.errors.push('Invalid Stripe key format');
      return result;
    }

    // Test key validity with Stripe API
    try {
      const response = await supabase.functions.invoke('validate-stripe-key', {
        body: { key, keyType: result.keyType }
      });
      
      if (response.error) {
        result.errors.push('Key validation failed: ' + response.error.message);
      } else {
        result.isValid = true;
      }
    } catch (error) {
      result.errors.push('Failed to validate key with Stripe API');
    }

    return result;
  }

  async syncEnvironmentVariables(sourceEnv: string, targetEnv: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('sync-environment-variables', {
        body: { sourceEnv, targetEnv }
      });

      if (error) throw error;
      return data.success;
    } catch (error) {
      console.error('Environment sync failed:', error);
      return false;
    }
  }

  async rotateStripeKeys(environment: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('rotate-stripe-keys', {
        body: { environment }
      });

      if (error) throw error;
      
      // Log rotation
      await this.logKeyRotation(environment, 'stripe_keys', 'success');
      return true;
    } catch (error) {
      await this.logKeyRotation(environment, 'stripe_keys', 'failed');
      console.error('Key rotation failed:', error);
      return false;
    }
  }

  private async logKeyRotation(environment: string, keyType: string, status: string): Promise<void> {
    await supabase.from('stripe_key_rotation_logs').insert({
      environment,
      key_type: keyType,
      status,
      rotated_at: new Date().toISOString()
    });
  }

  async getEnvironmentStatus(environment: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('get-environment-status', {
        body: { environment }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get environment status:', error);
      return null;
    }
  }
}