import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { FallbackAlertCircle } from '@/components/ui/fallback-icons';
import { Badge } from '@/components/ui/badge';
import { EnvKeySyncer } from '@/utils/envKeySyncer';
import { AutoSyncService } from '@/services/AutoSyncService';
import { AutoSyncManager } from '@/components/AutoSyncManager';
import { APIKeyTester } from './APIKeyTester';
import { FamousApiKeySync } from '@/utils/famousApiKeySync';
import { EnvironmentValidator } from '../../utils/environmentValidator';


interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [apiKeys, setApiKeys] = useState({
    stripe: '',
    googleMaps: '',
    resend: ''
  });
  const [validation, setValidation] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [discoveredKeys, setDiscoveredKeys] = useState<any>(null);
  // Auto-discover API keys on component mount
  // Auto-discover API keys on component mount
  useEffect(() => {
    // Check production environment first
    const productionConfig = FamousApiKeySync.validateProductionConfig();
    if (productionConfig.isValid) {
      console.log('✅ Production environment detected with valid config');
      return;
    }

    // Try Famous API key sync for development
    FamousApiKeySync.syncToProduction().then(syncResult => {
      if (syncResult) {
        console.log('✅ Famous API keys synced successfully');
      }
    }).catch(error => {
      console.warn('API key sync failed:', error);
    });
    
    // Check for discovered keys in development only
    const isProduction = typeof window !== 'undefined' && 
      (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'));
    
    if (!isProduction) {
      try {
        const syncer = EnvKeySyncer.getInstance();
        const sources = syncer.getAllSources();
        setDiscoveredKeys(sources);
        
        // Auto-sync if keys found
        if (sources.some(source => Object.keys(source.keys).length > 0)) {
          setSyncing(true);
          console.log('🔍 Discovered API keys from Famous setup:', syncer.generateReport());
          
          // Start auto sync service
          const autoSync = AutoSyncService.getInstance();
          autoSync.start();
          
          setSyncing(false);
        }
      } catch (error) {
        console.warn('Key discovery failed:', error);
      }
    }
    
    // Initial validation
    setValidation(EnvironmentValidator.validateAll());
  }, []);

  // Show discovered keys section
  const renderDiscoveredKeys = () => {
    if (!discoveredKeys || discoveredKeys.every((source: any) => Object.keys(source.keys).length === 0)) {
      return null;
    }

    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            API Keys Discovered from Famous Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {discoveredKeys.map((source: any, idx: number) => {
              const keyCount = Object.keys(source.keys).length;
              if (keyCount === 0) return null;
              
              return (
                <div key={idx} className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Found in {source.name} ({keyCount} keys)
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(source.keys).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-gray-600">{key}</span>
                        <Badge variant="outline" className="text-xs">
                          {value.length > 10 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="bg-green-50 border border-green-200 p-3 rounded">
              <p className="text-sm text-green-800">
                ✅ These keys have been automatically synced to your .env.local file. 
                Restart your development server to apply changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  const steps = [
    {
      title: 'Supabase Configuration',
      description: 'Database and authentication backend',
      validation: validation?.supabase,
      instructions: [
        '1. Go to https://supabase.com and create a new project',
        '2. In your project settings, copy the Project URL',
        '3. Copy the anon/public API key',
        '4. Add to .env.local: VITE_SUPABASE_URL=your-url',
        '5. Add to .env.local: VITE_SUPABASE_PUBLISHABLE_KEY=your-key'
      ]

    },
    {
      title: 'Stripe Payment Setup',
      description: 'Payment processing for landscaping services',
      validation: validation?.stripe,
      instructions: [
        '1. Create account at https://stripe.com',
        '2. Go to Developers > API Keys in your dashboard',
        '3. Copy the Publishable key (starts with pk_)',
        '4. Copy the Secret key (starts with sk_)',
        '5. Add to .env.local: VITE_STRIPE_PUBLISHABLE_KEY=pk_...',
        '6. Add to .env.local: VITE_STRIPE_SECRET_KEY=sk_...'
      ]
    },
    {
      title: 'Google Maps API',
      description: 'Location services and mapping',
      validation: validation?.googleMaps,
      instructions: [
        '1. Go to https://console.cloud.google.com',
        '2. Create a new project or select existing',
        '3. Enable Maps JavaScript API',
        '4. Create credentials > API Key',
        '5. Restrict the key to your domain',
        '6. Add to .env.local: VITE_GOOGLE_MAPS_API_KEY=your-key'
      ]
    },
    {
      title: 'Resend Email API',
      description: 'Email notifications and communications',
      validation: validation?.resend,
      instructions: [
        '1. Sign up at https://resend.com',
        '2. Go to API Keys in your dashboard',
        '3. Create a new API key',
        '4. Copy the key (starts with re_)',
        '5. Add to .env.local: VITE_RESEND_API_KEY=re_...'
      ]
    }
  ];

  const getStatusIcon = (validation: any) => {
    if (!validation) return <FallbackAlertCircle className="h-5 w-5 text-yellow-500" />;
    if (validation.isValid) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (validation: any) => {
    if (!validation) return <Badge variant="secondary">Not Checked</Badge>;
    if (validation.isValid) return <Badge variant="default" className="bg-green-500">Valid</Badge>;
    return <Badge variant="destructive">Invalid</Badge>;
  };

  const handleRefresh = () => {
    setValidation(EnvironmentValidator.validateAll());
  };

  const allValid = validation?.overall.isValid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GreenScape Lux Setup Wizard
          </h1>
          <p className="text-gray-600">
            Configure your API keys to enable all features
          </p>
        </div>

        {validation?.overall && !validation.overall.isValid && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800">{validation.overall.message}</p>
          </div>
        )}
        
        {/* Show discovered keys if any */}
        {renderDiscoveredKeys()}
        <div className="grid gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(step.validation)}
                    <div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(step.validation)}
                </div>
              </CardHeader>
              <CardContent>
                {step.validation && !step.validation.isValid && (
                  <Alert className="mb-4">
                    <AlertDescription>
                      {step.validation.message}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  {step.instructions.map((instruction, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-sm text-gray-600 min-w-0 flex-1">
                        {instruction}
                      </span>
                      {instruction.includes('https://') && (
                        <ExternalLink className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Auto Sync Manager */}
        <div className="mt-6">
          <AutoSyncManager />
        </div>

        {/* API Connection Tester */}
        <div className="mt-6">
          <APIKeyTester />
        </div>
        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={handleRefresh} variant="outline">
            Refresh Status
          </Button>
          {allValid ? (
            <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
              Complete Setup
            </Button>
          ) : (
            <Button disabled>
              Complete Setup (Fix Issues First)
            </Button>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Environment File Location</h3>
          <p className="text-sm text-gray-600">
            Create a <code className="bg-gray-200 px-1 rounded">.env.local</code> file 
            in your project root directory and add the API keys as shown above.
          </p>
        </div>
      </div>
    </div>
  );
};