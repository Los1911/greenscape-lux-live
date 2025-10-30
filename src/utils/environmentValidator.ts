export interface EnvironmentCheck {
  key: string;
  value?: string;
  required: boolean;
  valid: boolean;
  error?: string;
  warning?: string;
  source: 'local' | 'vercel' | 'supabase';
}

export interface EnvironmentReport {
  valid: boolean;
  checks: EnvironmentCheck[];
  missing: string[];
  invalid: string[];
  warnings: string[];
  score: number; // 0-100
}

export class EnvironmentValidator {
  private requiredEnvVars = [
    {
      key: 'VITE_SUPABASE_URL',
      required: true,
      validator: (value: string) => value.startsWith('https://') && value.includes('.supabase.co'),
      error: 'Must be a valid Supabase URL'
    },
    {
      key: 'VITE_SUPABASE_PUBLISHABLE_KEY', 
      required: true,
      validator: (value: string) => value.startsWith('eyJ') && value.length > 100,
      error: 'Must be a valid Supabase anon key (JWT token)'
    },
    {
      key: 'VITE_STRIPE_PUBLISHABLE_KEY',
      required: true,
      validator: (value: string) => value.startsWith('pk_'),
      error: 'Must be a valid Stripe publishable key (starts with pk_)',
      warning: (value: string) => value.startsWith('pk_live_') ? 'Using LIVE Stripe key' : undefined
    },
    {
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      required: true,
      validator: (value: string) => value.length > 20,
      error: 'Must be a valid Google Maps API key'
    }
  ];

  private supabaseSecrets = [
    {
      key: 'RESEND_API_KEY',
      required: true,
      validator: (value: string) => value.startsWith('re_'),
      error: 'Must be a valid Resend API key'
    },
    {
      key: 'STRIPE_SECRET_KEY',
      required: true,
      validator: (value: string) => value.startsWith('sk_'),
      error: 'Must be a valid Stripe secret key'
    },
    {
      key: 'STRIPE_WEBHOOK_SECRET',
      required: true,
      validator: (value: string) => value.startsWith('whsec_'),
      error: 'Must be a valid Stripe webhook secret'
    }
  ];

  validateLocal(): EnvironmentReport {
    const checks: EnvironmentCheck[] = [];
    const missing: string[] = [];
    const invalid: string[] = [];
    const warnings: string[] = [];

    for (const envVar of this.requiredEnvVars) {
      const value = import.meta.env[envVar.key];
      const check: EnvironmentCheck = {
        key: envVar.key,
        value: value ? this.maskValue(value) : undefined,
        required: envVar.required,
        valid: false,
        source: 'local'
      };

      if (!value) {
        missing.push(envVar.key);
        check.error = 'Missing required environment variable';
      } else if (!envVar.validator(value)) {
        invalid.push(envVar.key);
        check.error = envVar.error;
      } else {
        check.valid = true;
        if (envVar.warning) {
          const warning = envVar.warning(value);
          if (warning) {
            warnings.push(`${envVar.key}: ${warning}`);
            check.warning = warning;
          }
        }
      }

      checks.push(check);
    }

    const valid = missing.length === 0 && invalid.length === 0;
    const score = this.calculateScore(checks);

    return {
      valid,
      checks,
      missing,
      invalid,
      warnings,
      score
    };
  }

  async validateVercel(): Promise<EnvironmentReport> {
    const checks: EnvironmentCheck[] = [];
    const missing: string[] = [];
    const invalid: string[] = [];
    const warnings: string[] = [];

    const vercelToken = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!vercelToken || !projectId) {
      return {
        valid: false,
        checks: [{
          key: 'VERCEL_CONFIG',
          required: true,
          valid: false,
          error: 'VERCEL_TOKEN or VERCEL_PROJECT_ID not configured',
          source: 'vercel'
        }],
        missing: ['VERCEL_TOKEN', 'VERCEL_PROJECT_ID'],
        invalid: [],
        warnings: [],
        score: 0
      };
    }

    try {
      const response = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
        headers: {
          'Authorization': `Bearer ${vercelToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status}`);
      }

      const data = await response.json();
      const vercelEnvs = data.envs || [];

      for (const envVar of this.requiredEnvVars) {
        const vercelEnv = vercelEnvs.find((env: any) => env.key === envVar.key);
        const check: EnvironmentCheck = {
          key: envVar.key,
          required: envVar.required,
          valid: false,
          source: 'vercel'
        };

        if (!vercelEnv) {
          missing.push(envVar.key);
          check.error = 'Missing in Vercel environment';
        } else {
          check.value = this.maskValue(vercelEnv.value);
          if (!envVar.validator(vercelEnv.value)) {
            invalid.push(envVar.key);
            check.error = envVar.error;
          } else {
            check.valid = true;
            if (envVar.warning) {
              const warning = envVar.warning(vercelEnv.value);
              if (warning) {
                warnings.push(`${envVar.key}: ${warning}`);
                check.warning = warning;
              }
            }
          }
        }

        checks.push(check);
      }
    } catch (error) {
      return {
        valid: false,
        checks: [{
          key: 'VERCEL_API',
          required: true,
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'vercel'
        }],
        missing: [],
        invalid: [],
        warnings: [],
        score: 0
      };
    }

    const valid = missing.length === 0 && invalid.length === 0;
    const score = this.calculateScore(checks);

    return {
      valid,
      checks,
      missing,
      invalid,
      warnings,
      score
    };
  }

  async validateSupabase(): Promise<EnvironmentReport> {
    const checks: EnvironmentCheck[] = [];
    const missing: string[] = [];
    const invalid: string[] = [];
    const warnings: string[] = [];

    // Note: We can't directly access Supabase secrets for security reasons
    // This would require a dedicated edge function to validate without exposing values
    for (const secret of this.supabaseSecrets) {
      checks.push({
        key: secret.key,
        required: secret.required,
        valid: true, // Assume valid unless we can check
        source: 'supabase',
        warning: 'Cannot validate Supabase secrets directly - manual verification required'
      });
      warnings.push(`${secret.key}: Manual verification required`);
    }

    return {
      valid: true,
      checks,
      missing,
      invalid,
      warnings,
      score: 75 // Partial score since we can't fully validate
    };
  }

  async compareEnvironments(): Promise<{
    mismatches: Array<{
      key: string;
      local?: string;
      vercel?: string;
      supabase?: string;
    }>;
    recommendations: string[];
  }> {
    const localReport = this.validateLocal();
    const vercelReport = await this.validateVercel();
    
    const mismatches: Array<{
      key: string;
      local?: string;
      vercel?: string;
      supabase?: string;
    }> = [];

    const recommendations: string[] = [];

    // Compare local vs Vercel
    for (const localCheck of localReport.checks) {
      const vercelCheck = vercelReport.checks.find(c => c.key === localCheck.key);
      
      if (localCheck.valid && vercelCheck?.valid) {
        // Both exist and are valid, but might have different values
        if (localCheck.value !== vercelCheck.value) {
          mismatches.push({
            key: localCheck.key,
            local: localCheck.value,
            vercel: vercelCheck.value
          });
        }
      } else if (localCheck.valid && !vercelCheck?.valid) {
        recommendations.push(`Sync ${localCheck.key} to Vercel`);
      } else if (!localCheck.valid && vercelCheck?.valid) {
        recommendations.push(`Update local ${localCheck.key} from Vercel`);
      }
    }

    return { mismatches, recommendations };
  }

  private maskValue(value: string): string {
    if (value.length <= 8) return value;
    return value.substring(0, 8) + '...';
  }

  private calculateScore(checks: EnvironmentCheck[]): number {
    if (checks.length === 0) return 0;
    
    const validCount = checks.filter(c => c.valid).length;
    return Math.round((validCount / checks.length) * 100);
  }

  generateReport(): string {
    const localReport = this.validateLocal();
    
    let report = '# Environment Validation Report\n\n';
    report += `**Overall Score:** ${localReport.score}/100\n`;
    report += `**Status:** ${localReport.valid ? '✅ VALID' : '❌ INVALID'}\n\n`;

    if (localReport.missing.length > 0) {
      report += '## Missing Variables\n';
      localReport.missing.forEach(key => {
        report += `- ❌ ${key}\n`;
      });
      report += '\n';
    }

    if (localReport.invalid.length > 0) {
      report += '## Invalid Variables\n';
      localReport.invalid.forEach(key => {
        const check = localReport.checks.find(c => c.key === key);
        report += `- ❌ ${key}: ${check?.error}\n`;
      });
      report += '\n';
    }

    if (localReport.warnings.length > 0) {
      report += '## Warnings\n';
      localReport.warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`;
      });
      report += '\n';
    }

    report += '## All Variables\n';
    localReport.checks.forEach(check => {
      const status = check.valid ? '✅' : '❌';
      report += `- ${status} ${check.key}: ${check.value || 'Not set'}\n`;
      if (check.error) {
        report += `  - Error: ${check.error}\n`;
      }
      if (check.warning) {
        report += `  - Warning: ${check.warning}\n`;
      }
    });

    return report;
  }
}