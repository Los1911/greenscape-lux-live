/**
 * Environment Variable Fallback System
 * Provides helpful error messages when env vars are missing
 */

export function checkCriticalEnvVars(): { 
  isValid: boolean; 
  missing: string[]; 
  message: string;
} {
  const required = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value || value === 'undefined')
    .map(([key]) => key);

  if (missing.length > 0) {
    return {
      isValid: false,
      missing,
      message: `Missing environment variables: ${missing.join(', ')}. 
      
Please configure GitHub Secrets:
1. Go to: https://github.com/Los1911/greenscape-lux-live/settings/secrets/actions
2. Add required secrets (see GITHUB_SECRETS_SETUP_GUIDE.md)
3. Trigger new deployment

For local development, copy .env.local.template to .env.local`
    };
  }

  return {
    isValid: true,
    missing: [],
    message: 'All environment variables configured'
  };
}

export function showEnvErrorScreen(missing: string[]): void {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 40px;
        max-width: 600px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <h1 style="color: #dc2626; margin: 0 0 20px 0;">⚠️ Configuration Required</h1>
        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
          GreenScape Lux requires environment variables to function. 
          The following are missing:
        </p>
        <ul style="background: #fef2f2; padding: 20px; border-radius: 8px; color: #991b1b;">
          ${missing.map(key => `<li style="margin: 8px 0;"><code>${key}</code></li>`).join('')}
        </ul>
        <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937;">🔧 Quick Fix:</h3>
          <ol style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Go to <a href="https://github.com/Los1911/greenscape-lux-live/settings/secrets/actions" 
                style="color: #2563eb;">GitHub Secrets</a></li>
            <li>Add required environment variables</li>
            <li>Trigger new deployment</li>
          </ol>
        </div>
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
          📖 See <code>GITHUB_SECRETS_SETUP_GUIDE.md</code> for detailed instructions
        </p>
      </div>
    </div>
  `;
}
