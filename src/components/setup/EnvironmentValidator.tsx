import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface EnvVariable {
  key: string;
  required: boolean;
  description: string;
  pattern?: RegExp;
  example?: string;
}

const REQUIRED_ENV_VARS: EnvVariable[] = [
  {
    key: 'VITE_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    pattern: /^https:\/\/[a-z0-9]+\.supabase\.co$/,
    example: 'https://your-project.supabase.co'
  },
  {
    key: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key',
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    key: 'VITE_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe publishable key',
    pattern: /^pk_(test_|live_)[a-zA-Z0-9]+$/,
    example: 'pk_live_...'
  },
  {
    key: 'VITE_GOOGLE_MAPS_API_KEY',
    required: true,
    description: 'Google Maps API key',
    pattern: /^[A-Za-z0-9_-]+$/,
    example: 'AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4'
  },
  {
    key: 'VITE_SITE_URL',
    required: true,
    description: 'Site URL for redirects',
    pattern: /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    example: 'https://greenscapelux.com'
  },
  {
    key: 'VITE_ADMIN_EMAIL',
    required: true,
    description: 'Admin email address',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    example: 'admin.1@greenscapelux.com'
  }
];

interface ValidationResult {
  key: string;
  status: 'valid' | 'invalid' | 'missing' | 'placeholder';
  message: string;
  value?: string;
}

export function EnvironmentValidator() {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

  const validateEnvironment = async () => {
    setIsValidating(true);
    const validationResults: ValidationResult[] = [];

    for (const envVar of REQUIRED_ENV_VARS) {
      const value = import.meta.env[envVar.key];
      
      if (!value || value.trim() === '') {
        validationResults.push({
          key: envVar.key,
          status: 'missing',
          message: `${envVar.key} is required but not set`
        });
        continue;
      }

      // Check for placeholder values
      const placeholderPatterns = [
        /your[_-]?project/i,
        /your[_-]?key/i,
        /example/i,
        /placeholder/i
      ];

      const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(value));
      if (isPlaceholder) {
        validationResults.push({
          key: envVar.key,
          status: 'placeholder',
          message: `${envVar.key} contains placeholder value`,
          value: value.substring(0, 30) + '...'
        });
        continue;
      }

      // Check pattern validation
      if (envVar.pattern && !envVar.pattern.test(value)) {
        validationResults.push({
          key: envVar.key,
          status: 'invalid',
          message: `${envVar.key} has invalid format`,
          value: value.substring(0, 20) + '...'
        });
        continue;
      }

      validationResults.push({
        key: envVar.key,
        status: 'valid',
        message: `${envVar.key} is properly configured`
      });
    }

    setResults(validationResults);
    setLastValidated(new Date());
    setIsValidating(false);
  };

  useEffect(() => {
    validateEnvironment();
  }, []);

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'placeholder':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: ValidationResult['status']) => {
    const variants = {
      valid: 'default',
      invalid: 'destructive',
      missing: 'destructive',
      placeholder: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const validCount = results.filter(r => r.status === 'valid').length;
  const totalCount = results.length;
  const hasErrors = results.some(r => r.status === 'invalid' || r.status === 'missing');
  const hasWarnings = results.some(r => r.status === 'placeholder');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Environment Variable Validation
          <Button
            variant="outline"
            size="sm"
            onClick={validateEnvironment}
            disabled={isValidating}
          >
            {isValidating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Revalidate
          </Button>
        </CardTitle>
        <CardDescription>
          Validates all required environment variables for proper application functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="text-sm">
            <span className="font-medium">{validCount}/{totalCount}</span> variables valid
          </div>
          {lastValidated && (
            <div className="text-sm text-muted-foreground">
              Last checked: {lastValidated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Alerts */}
        {hasErrors && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Critical environment variables are missing or invalid. The application may not function properly.
            </AlertDescription>
          </Alert>
        )}

        {hasWarnings && !hasErrors && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some environment variables contain placeholder values. Update them with actual values.
            </AlertDescription>
          </Alert>
        )}

        {!hasErrors && !hasWarnings && validCount > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All environment variables are properly configured!
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        <div className="space-y-2">
          {results.map((result) => {
            const envVar = REQUIRED_ENV_VARS.find(v => v.key === result.key);
            return (
              <div
                key={result.key}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium text-sm">{result.key}</div>
                    <div className="text-xs text-muted-foreground">
                      {envVar?.description}
                    </div>
                    {result.value && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Current: {result.value}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(result.status)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        {(hasErrors || hasWarnings) && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">How to Fix:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Update your .env.local file with the correct values</li>
              <li>• For deployment, set environment variables in Vercel/hosting platform</li>
              <li>• Refer to .env.local.template for examples</li>
              <li>• Restart the development server after making changes</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}