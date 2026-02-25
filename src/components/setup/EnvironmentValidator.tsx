import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnvVar {
  key: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  {
    key: 'VITE_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
  },
  {
    key: 'VITE_SUPABASE_PUBLISHABLE_KEY',
    required: true,
    description: 'Supabase publishable key',
  },
  {
    key: 'VITE_STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key',
  },
  {
    key: 'VITE_GOOGLE_MAPS_API_KEY',
    required: false,
    description: 'Google Maps API key',
  },
];

export function EnvironmentValidator() {
  const missingRequired = ENV_VARS.filter(
    (v) => v.required && !import.meta.env[v.key]
  );

  if (missingRequired.length === 0) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          All required environment variables are configured
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <p className="font-semibold mb-2">Missing required environment variables:</p>
        <ul className="list-disc list-inside space-y-1">
          {missingRequired.map((v) => (
            <li key={v.key}>
              <code className="text-sm">{v.key}</code> - {v.description}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
