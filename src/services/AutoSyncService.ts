// Automatic API Key Synchronization Service
import { EnvKeySyncer } from '../utils/envKeySyncer';
import { EnvFileManager } from '../utils/envFileManager';

export interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  syncCount: number;
  errors: string[];
  discoveredKeys: Record<string, string>;
}

export class AutoSyncService {
  private static instance: AutoSyncService;
  private intervalId: number | null = null;
  private status: SyncStatus = {
    isRunning: false,
    lastSync: null,
    syncCount: 0,
    errors: [],
    discoveredKeys: {}
  };
  
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly MAX_ERRORS = 10;
  
  static getInstance(): AutoSyncService {
    if (!AutoSyncService.instance) {
      AutoSyncService.instance = new AutoSyncService();
    }
    return AutoSyncService.instance;
  }

  // Start automatic synchronization
  start(): void {
    // Check if we're in production - don't run auto sync in production
    const isProduction = typeof window !== 'undefined' && 
      (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'));
    
    if (isProduction) {
      console.log('🌿 Production environment detected - skipping AutoSync service');
      return;
    }

    if (this.status.isRunning) {
      console.log('🔄 AutoSync already running');
      return;
    }

    console.log('🚀 Starting AutoSync service...');
    this.status.isRunning = true;
    
    // Run initial sync
    this.performSync();
    
    // Set up periodic sync
    this.intervalId = window.setInterval(() => {
      this.performSync();
    }, this.SYNC_INTERVAL);
  }

  // Stop automatic synchronization
  stop(): void {
    if (!this.status.isRunning) return;
    
    console.log('⏹️ Stopping AutoSync service...');
    this.status.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Perform synchronization check
  private async performSync(): Promise<void> {
    try {
      const syncer = EnvKeySyncer.getInstance();
      const sources = syncer.getAllSources();
      
      // Check if new keys are available
      const newKeys: Record<string, string> = {};
      sources.forEach(source => {
        Object.entries(source.keys).forEach(([key, value]) => {
          if (!this.status.discoveredKeys[key] || this.status.discoveredKeys[key] !== value) {
            newKeys[key] = value;
          }
        });
      });

      if (Object.keys(newKeys).length > 0) {
        console.log('🔍 New API keys discovered:', Object.keys(newKeys));
        
        // Update discovered keys
        this.status.discoveredKeys = { ...this.status.discoveredKeys, ...newKeys };
        
        // Trigger environment update
        await this.updateEnvironment(newKeys);
        
        // Notify components of changes
        this.notifyEnvironmentChange(newKeys);
      }

      this.status.lastSync = new Date();
      this.status.syncCount++;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      this.status.errors.push(`${new Date().toISOString()}: ${errorMsg}`);
      
      // Limit error history
      if (this.status.errors.length > this.MAX_ERRORS) {
        this.status.errors = this.status.errors.slice(-this.MAX_ERRORS);
      }
      
      console.error('❌ AutoSync error:', error);
    }
  }

  // Update environment with new keys
  private async updateEnvironment(newKeys: Record<string, string>): Promise<void> {
    try {
      // In production, we can't write to .env files, so just store in localStorage
      const isProduction = typeof window !== 'undefined' && 
        (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'));
      
      if (!isProduction) {
        try {
          const envManager = EnvFileManager.getInstance();
          
          // Queue updates to .env.local file (development only)
          Object.entries(newKeys).forEach(([key, value]) => {
            envManager.queueUpdate(key, value);
          });
        } catch (error) {
          console.warn('Failed to update .env file:', error);
        }
      }
      
      // Store in localStorage for immediate access
      Object.entries(newKeys).forEach(([key, value]) => {
        localStorage.setItem(`GSL_${key}`, value);
      });

      // Update runtime environment
      Object.entries(newKeys).forEach(([key, value]) => {
        // @ts-ignore - Dynamic environment update
        if (window.ENV) {
          window.ENV[key] = value;
        }
      });

      console.log('✅ Environment updated with new keys');
      
    } catch (error) {
      console.error('❌ Failed to update environment:', error);
      throw error;
    }
  }

  // Notify components of environment changes
  private notifyEnvironmentChange(newKeys: Record<string, string>): void {
    // Dispatch custom event for components to listen to
    const event = new CustomEvent('env-keys-updated', {
      detail: { newKeys, allKeys: this.status.discoveredKeys }
    });
    window.dispatchEvent(event);
  }

  // Get current sync status
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  // Force immediate sync
  async forcSync(): Promise<void> {
    console.log('🔄 Force sync requested...');
    await this.performSync();
  }

  // Clear error history
  clearErrors(): void {
    this.status.errors = [];
  }
}