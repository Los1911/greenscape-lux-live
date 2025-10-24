// supabase/functions/_shared/serverConfig.ts

export const serverConfig = {
  supabaseServiceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "__________SUPABASE_SERVICE_ROLE_KEY__________",
  stripeSecretKey: Deno.env.get("STRIPE_SECRET_KEY") || "__________STRIPE_SECRET_KEY__________",
  stripeWebhookSecret: Deno.env.get("STRIPE_WEBHOOK_SECRET") || "__________STRIPE_WEBHOOK_SECRET__________",
  resendApiKey: Deno.env.get("RESEND_API_KEY") || "__________RESEND_API_KEY__________",
};

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigValidationError";
  }
}

export function validateRequiredSecrets(requiredSecrets: string[]): void {
  const missing: string[] = [];
  const placeholder: string[] = [];

  for (const secret of requiredSecrets) {
    const value = serverConfig[secret as keyof typeof serverConfig];
    
    if (!value) {
      missing.push(secret);
    } else if (value.startsWith("__________") && value.endsWith("__________")) {
      placeholder.push(secret);
    }
  }

  if (missing.length > 0 || placeholder.length > 0) {
    const errors: string[] = [];
    
    if (missing.length > 0) {
      errors.push(`Missing secrets: ${missing.join(", ")}`);
    }
    
    if (placeholder.length > 0) {
      errors.push(`Placeholder values detected: ${placeholder.join(", ")}`);
    }
    
    throw new ConfigValidationError(
      `Configuration validation failed: ${errors.join("; ")}. ` +
      `Please configure these secrets in your Supabase Edge Function settings.`
    );
  }
}
