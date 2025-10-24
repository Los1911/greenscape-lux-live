import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { EnvironmentSyncService, ValidationResult, SyncResult } from '../../services/EnvironmentSyncService';

export function EnvironmentSyncDashboard() {
  const [syncService] = useState(new EnvironmentSyncService());
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});
  const [loading, setLoading] = useState(false);
  const [showValues, setShowValues] = useState(false);
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => {
    validateEnvironments();
    
    if (autoSync) {
      const interval = setInterval(validateEnvironments, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoSync]);

  const validateEnvironments = async () => {
    setLoading(true);
    try {
      const result = await syncService.validateEnvironments();
      setValidation(result);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncToVercel = async () => {
    setLoading(true);
    try {
      const localEnv = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
        VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
        VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      };

      const result = await syncService.syncToVercel(localEnv);
      setSyncResults(prev => ({ ...prev, vercel: result }));
      
      // Re-validate after sync
      await validateEnvironments();
    } catch (error) {
      console.error('Vercel sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncToSupabase = async () => {
    setLoading(true);
    try {
      const secrets = {
        RESEND_API_KEY: 'configured',
        STRIPE_SECRET_KEY: 'configured',
        STRIPE_WEBHOOK_SECRET: 'configured'
      };

      const result = await syncService.syncToSupabase(secrets);
      setSyncResults(prev => ({ ...prev, supabase: result }));
      
      await validateEnvironments();
    } catch (error) {
      console.error('Supabase sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const maskValue = (value: string) => {
    if (!showValues) {
      return value.substring(0, 8) + '...';
    }
    return value;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Environment Sync Dashboard</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowValues(!showValues)}
          >
            {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showValues ? 'Hide' : 'Show'} Values
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoSync(!autoSync)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Auto-sync: {autoSync ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={validateEnvironments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Validate
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validation ? getStatusIcon(validation.valid) : <RefreshCw className="h-5 w-5" />}
            Environment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validation ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validation.valid ? 'VALID' : 'INVALID'}
                </div>
                <div className="text-sm text-gray-600">Overall Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validation.missing.length}
                </div>
                <div className="text-sm text-gray-600">Missing Variables</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {validation.mismatches.length}
                </div>
                <div className="text-sm text-gray-600">Mismatches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {validation.warnings.length}
                </div>
                <div className="text-sm text-gray-600">Warnings</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <div>Validating environments...</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missing Variables */}
      {validation?.missing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Missing Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {validation.missing.map((variable) => (
                <Badge key={variable} variant="destructive">
                  {variable}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environment Mismatches */}
      {validation?.mismatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Environment Mismatches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validation.mismatches.map((mismatch) => (
                <div key={mismatch.key} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{mismatch.key}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-blue-600">Local:</div>
                      <div className="font-mono bg-gray-100 p-2 rounded">
                        {mismatch.local ? maskValue(mismatch.local) : 'Not set'}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-green-600">Vercel:</div>
                      <div className="font-mono bg-gray-100 p-2 rounded">
                        {mismatch.vercel ? maskValue(mismatch.vercel) : 'Not set'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sync to Vercel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Sync environment variables from local development to Vercel production.
              </p>
              <Button onClick={syncToVercel} disabled={loading} className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sync to Vercel
              </Button>
              {syncResults.vercel && (
                <Alert>
                  <AlertDescription>
                    {syncResults.vercel.success ? (
                      <span className="text-green-600">
                        ✅ Synced {syncResults.vercel.synced.length} variables
                      </span>
                    ) : (
                      <span className="text-red-600">
                        ❌ Failed to sync {syncResults.vercel.failed.length} variables
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync to Supabase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Validate Supabase secrets are configured correctly.
              </p>
              <Button onClick={syncToSupabase} disabled={loading} className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Validate Supabase
              </Button>
              {syncResults.supabase && (
                <Alert>
                  <AlertDescription>
                    {syncResults.supabase.success ? (
                      <span className="text-green-600">
                        ✅ Supabase secrets validated
                      </span>
                    ) : (
                      <span className="text-red-600">
                        ❌ Supabase validation failed
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {validation?.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validation.warnings.map((warning, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}