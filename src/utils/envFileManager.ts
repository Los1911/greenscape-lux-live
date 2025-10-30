// Environment File Manager - Handles .env.local file operations
export interface EnvFileUpdate {
  key: string;
  value: string;
  timestamp: Date;
}

export class EnvFileManager {
  private static instance: EnvFileManager;
  private updateQueue: EnvFileUpdate[] = [];
  private isProcessing = false;
  
  static getInstance(): EnvFileManager {
    if (!EnvFileManager.instance) {
      EnvFileManager.instance = new EnvFileManager();
    }
    return EnvFileManager.instance;
  }

  // Queue environment variable update
  queueUpdate(key: string, value: string): void {
    const update: EnvFileUpdate = {
      key,
      value,
      timestamp: new Date()
    };
    
    // Remove existing update for same key
    this.updateQueue = this.updateQueue.filter(u => u.key !== key);
    this.updateQueue.push(update);
    
    console.log(`📝 Queued env update: ${key}`);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Process queued updates
  private async processQueue(): Promise<void> {
    if (this.updateQueue.length === 0 || this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Batch process updates
      const updates = [...this.updateQueue];
      this.updateQueue = [];
      
      await this.applyUpdates(updates);
      
      console.log(`✅ Applied ${updates.length} environment updates`);
      
    } catch (error) {
      console.error('❌ Failed to process env updates:', error);
      
      // Re-queue failed updates
      this.updateQueue.unshift(...this.updateQueue);
      
    } finally {
      this.isProcessing = false;
      
      // Process any new updates that came in
      if (this.updateQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  // Apply updates to environment
  private async applyUpdates(updates: EnvFileUpdate[]): Promise<void> {
    // In a browser environment, we can't directly write to .env.local
    // Instead, we'll store in localStorage and notify the system
    
    updates.forEach(update => {
      // Store in localStorage with GSL prefix
      localStorage.setItem(`GSL_${update.key}`, update.value);
      
      // Also store without prefix for compatibility
      localStorage.setItem(update.key, update.value);
      
      // Update runtime environment if available
      if (typeof window !== 'undefined' && (window as any).ENV) {
        (window as any).ENV[update.key] = update.value;
      }
    });

    // Trigger environment refresh event
    const event = new CustomEvent('env-file-updated', {
      detail: { updates }
    });
    window.dispatchEvent(event);
    
    // For development, log the .env.local content that should be created
    if (process.env.NODE_ENV === 'development') {
      this.logEnvFileContent(updates);
    }
  }

  // Log what the .env.local file should contain
  private logEnvFileContent(updates: EnvFileUpdate[]): void {
    console.group('📄 .env.local file content:');
    
    const existingVars = this.getCurrentEnvVars();
    const allVars = { ...existingVars };
    
    updates.forEach(update => {
      allVars[update.key] = update.value;
    });
    
    Object.entries(allVars).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });
    
    console.groupEnd();
  }

  // Get current environment variables
  private getCurrentEnvVars(): Record<string, string> {
    const vars: Record<string, string> = {};
    
    // Get from import.meta.env
    if (typeof window !== 'undefined' && import.meta?.env) {
      Object.entries(import.meta.env).forEach(([key, value]) => {
        if (typeof value === 'string') {
          vars[key] = value;
        }
      });
    }
    
    // Get from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('GSL_') || key?.startsWith('VITE_')) {
        const cleanKey = key.startsWith('GSL_') ? key.slice(4) : key;
        vars[cleanKey] = localStorage.getItem(key) || '';
      }
    }
    
    return vars;
  }

  // Generate complete .env.local content
  generateEnvFileContent(): string {
    const vars = this.getCurrentEnvVars();
    
    let content = `# Auto-generated .env.local file
# Last updated: ${new Date().toISOString()}

# Supabase Configuration
VITE_SUPABASE_URL=${vars.VITE_SUPABASE_URL || 'https://mwvcbedvnimabfwubazz.supabase.co'}
VITE_SUPABASE_PUBLISHABLE_KEY=${vars.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-supabase-anon-key'}
VITE_SUPABASE_FUNCTIONS_URL=https://mwvcbedvnimabfwubazz.functions.supabase.co
VITE_SITE_URL=https://greenscapelux.com

# Admin Configuration
VITE_ADMIN_EMAIL=cmatthews@greenscapelux.com

# Development Settings
VITE_APP_ENV=development

# API Keys
VITE_STRIPE_PUBLISHABLE_KEY=${vars.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_key'}
VITE_GOOGLE_MAPS_API_KEY=${vars.VITE_GOOGLE_MAPS_API_KEY || 'your-google-maps-key'}
VITE_RESEND_API_KEY=${vars.VITE_RESEND_API_KEY || 're_your_resend_key'}
`;

    return content;
  }

  // Get pending updates count
  getPendingUpdatesCount(): number {
    return this.updateQueue.length;
  }

  // Check if processing
  isProcessingUpdates(): boolean {
    return this.isProcessing;
  }
}