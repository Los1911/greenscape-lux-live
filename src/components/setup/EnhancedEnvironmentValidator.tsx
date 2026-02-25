import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ValidationResult {
  key: string;
  required: boolean;
  present: boolean;
  valid: boolean;
  maskedValue: string;
  error?: string;
  description: string;
}

export function EnhancedEnvironmentValidator() {
  const validateEnvVar = (
    key: string,
    required: boolean,
    description: string,
    validator?: (value: string) => { valid: boolean; error?: string }
  ): ValidationResult => {
    const value = import.meta.env[key];
    const present = !!value && value !== 'undefined' && value !== 'null' && value !== 'SET';
    
    let valid = present;
    let error: string | undefined;
    
    if (present && validator) {
      const result = validator(value);
      valid = result.valid;
      error = result.error;
    }
    
    const maskedValue = present && value
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : 'NOT SET';
    
    return { key, required, present, valid, maskedValue, error, description };
  };

  const results: ValidationResult[] = [
    validateEnvVar(
      'VITE_SUPABASE_URL',
      true,
      'Supabase project URL',
      (v) => ({
        valid: v.includes('.supabase.co'),
        error: v.includes('.supabase.co') ? undefined : 'Must contain .supabase.co'
      })
    ),
    validateEnvVar(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      true,
      'Supabase publishable key',
      (v) => ({
        valid: v.startsWith('sb_publishable_') || v.startsWith('sb-publishable_'),
        error: v.startsWith('sb_publishable_') || v.startsWith('sb-publishable_')
          ? undefined
          : 'Must start with sb_publishable_ or sb-publishable_'
      })
    ),
    validateEnvVar(
      'VITE_STRIPE_PUBLISHABLE_KEY',
      false,
      'Stripe publishable key',
      (v) => ({
        valid: v.startsWith('pk_live_') || v.startsWith('pk_test_'),
        error: v.startsWith('pk_live_') || v.startsWith('pk_test_')
          ? undefined
          : 'Must start with pk_live_ or pk_test_'
      })
    ),
    validateEnvVar(
      'VITE_GOOGLE_MAPS_API_KEY',
      false,
      'Google Maps API key',
      (v) => ({
        valid: v.startsWith('AIza'),
        error: v.startsWith('AIza') ? undefined : 'Must start with AIza'
      })
    ),
    validateEnvVar(
      'VITE_RESEND_API_KEY',
      false,
      'Resend email API key',
      (v) => ({
        valid: v.startsWith('re_'),
        error: v.startsWith('re_') ? undefined : 'Must start with re_'
      })
    )
  ];

  const missingRequired = results.filter(r => r.required && !r.present);
  const invalidFormat = results.filter(r => r.present && !r.valid);
  const allValid = missingRequired.length === 0 && invalidFormat.length === 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {allValid ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          Environment Configuration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allValid && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All environment variables are properly configured and validated
            </AlertDescription>
          </Alert>
        )}

        {missingRequired.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Missing Required Variables</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {missingRequired.map(r => (
                  <li key={r.key}>
                    <code className="text-sm font-mono">{r.key}</code> - {r.description}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {invalidFormat.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Invalid Format</AlertTitle>
            <AlertDescription className="text-amber-800">
              <ul className="list-disc list-inside space-y-1 mt-2">
                {invalidFormat.map(r => (
                  <li key={r.key}>
                    <code className="text-sm font-mono">{r.key}</code>: {r.error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4" />
            Configuration Details
          </h4>
          <div className="space-y-1 text-sm">
            {results.map(r => (
              <div key={r.key} className="flex items-center justify-between py-1 border-b">
                <div className="flex items-center gap-2">
                  {r.valid ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : r.present ? (
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <code className="text-xs font-mono">{r.key}</code>
                  {r.required && <span className="text-xs text-red-600">(required)</span>}
                </div>
                <span className="text-xs text-gray-600 font-mono">{r.maskedValue}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
