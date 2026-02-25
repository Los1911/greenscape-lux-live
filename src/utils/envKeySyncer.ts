import { supabase } from '@/lib/supabase';

interface PlatformConfig {
  name: string;
  apiEndpoint?: string;
  apiKey?: string;
}

export class EnvKeySyncer {
  private platforms: Map<string, PlatformConfig> = new Map();

  constructor() {
    this.initializePlatforms();
  }

  private initializePlatforms() {
    this.platforms.set('deploypad', {
      name: 'DeployPad',
      apiEndpoint: 'https://api.deploypad.com/v1/env',
    });

    this.platforms.set('vercel', {
      name: 'Vercel',
      apiEndpoint: 'https://api.vercel.com/v9/projects',
      apiKey: import.meta.env.VITE_VERCEL_TOKEN,
    });

    this.platforms.set('github', {
      name: 'GitHub Actions',
      apiEndpoint: 'https://api.github.com/repos',
      apiKey: import.meta.env.VITE_GITHUB_TOKEN,
    });
  }

  async syncEnvironmentVariable(
    key: string,
    value: string,
    platforms: string[]
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const platform of platforms) {
      try {
        await this.syncToPlatform(platform, key, value);
        
        // Log to database
        await this.logSync(platform, key, 'success');
      } catch (error) {
        const errorMsg = `Failed to sync ${key} to ${platform}: ${error}`;
        errors.push(errorMsg);
        await this.logSync(platform, key, 'error', errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  private async syncToPlatform(
    platform: string,
    key: string,
    value: string
  ): Promise<void> {
    const config = this.platforms.get(platform);
    if (!config) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    switch (platform) {
      case 'vercel':
        await this.syncToVercel(key, value, config);
        break;
      case 'github':
        await this.syncToGitHub(key, value, config);
        break;
      case 'deploypad':
        await this.syncToDeployPad(key, value, config);
        break;
      default:
        throw new Error(`Sync not implemented for ${platform}`);
    }
  }

  private async syncToVercel(
    key: string,
    value: string,
    config: PlatformConfig
  ): Promise<void> {
    if (!config.apiKey) {
      throw new Error('Vercel API key not configured');
    }

    const projectId = import.meta.env.VITE_VERCEL_PROJECT_ID;
    const response = await fetch(
      `${config.apiEndpoint}/${projectId}/env`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          type: 'encrypted',
          target: ['production', 'preview', 'development'],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.statusText}`);
    }
  }

  private async syncToGitHub(
    key: string,
    value: string,
    config: PlatformConfig
  ): Promise<void> {
    if (!config.apiKey) {
      throw new Error('GitHub API key not configured');
    }

    const repo = import.meta.env.VITE_GITHUB_REPO || 'owner/repo';
    const encryptedValue = await this.encryptForGitHub(value, config.apiKey);

    const response = await fetch(
      `${config.apiEndpoint}/${repo}/actions/secrets/${key}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encrypted_value: encryptedValue,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
  }

  private async syncToDeployPad(
    key: string,
    value: string,
    config: PlatformConfig
  ): Promise<void> {
    // DeployPad-specific sync logic
    console.log(`Syncing ${key} to DeployPad`);
  }

  private async encryptForGitHub(value: string, publicKey: string): Promise<string> {
    // Simplified encryption - in production, use sodium or similar
    return btoa(value);
  }

  private async logSync(
    platform: string,
    key: string,
    status: string,
    error?: string
  ): Promise<void> {
    try {
      await supabase.from('environment_variables').insert({
        platform,
        key,
        status,
        error,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log sync:', err);
    }
  }
}
