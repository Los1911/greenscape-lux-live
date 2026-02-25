import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Info } from 'lucide-react';
import { envValidator, ValidationResult, FRONTEND_ENV_VARS } from '@/lib/envValidation';

interface EnvironmentValidationGateProps {
  children: React.ReactNode;
  blockOnErrors?: boolean;
}

export const EnvironmentValidationGate: React.FC<EnvironmentValidationGateProps> = ({ 
  children, 
  blockOnErrors = false 
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  const validateEnvironment = () => {
    setLoading(true);
    try {
      const result = envValidator.validateRuntime();
      setValidationResult(result);
    } catch (error) {
      console.error('Environment validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateEnvironment();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Validating environment variables...</p>
        </div>
      </div>
    );
  }

  if (!validationResult) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to validate environment variables. Please check your configuration.
        </AlertDescription>
      </Alert>
    );
  }

  // If validation passes or we're not blocking on errors, show children
  if (validationResult.valid || !blockOnErrors) {
    return (
      <>
        {!validationResult.valid && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Environment validation issues detected. Check console for details.
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {showDetails && !validationResult.valid && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Environment Variable Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnvironmentValidationDetails result={validationResult} />
            </CardContent>
          </Card>
        )}
        
        {children}
      </>
    );
  }

  // Block rendering if validation fails and blockOnErrors is true
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-6 w-6" />
            Environment Configuration Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Critical environment variables are missing or invalid. 
              The application cannot start until these issues are resolved.
            </AlertDescription>
          </Alert>

          <EnvironmentValidationDetails result={validationResult} />

          <div className="flex gap-2">
            <Button onClick={validateEnvironment} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Validation
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="default"
            >
              Reload Application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const EnvironmentValidationDetails: React.FC<{ result: ValidationResult }> = ({ result }) => {
  const envInfo = envValidator.getEnvironmentInfo();

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{result.warnings.length}</div>
          <div className="text-sm text-gray-600">Valid</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{result.missingRequired.length}</div>
          <div className="text-sm text-gray-600">Missing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{result.placeholderValues.length}</div>
          <div className="text-sm text-gray-600">Placeholders</div>
        </div>
      </div>

      {/* Environment Info */}
      <div className="bg-gray-50 p-3 rounded">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="font-medium">Environment Info</span>
        </div>
        <div className="text-sm space-y-1">
          <div>Mode: <Badge variant="outline">{envInfo.mode}</Badge></div>
          <div>Development: <Badge variant={envInfo.dev ? "default" : "secondary"}>{envInfo.dev ? 'Yes' : 'No'}</Badge></div>
          <div>Production: <Badge variant={envInfo.prod ? "default" : "secondary"}>{envInfo.prod ? 'Yes' : 'No'}</Badge></div>
        </div>
      </div>

      {/* Variable Status */}
      <div>
        <h4 className="font-medium mb-3">Variable Status</h4>
        <div className="space-y-2">
          {FRONTEND_ENV_VARS.map(envVar => {
            const info = envInfo.variables[envVar.key];
            const hasError = result.missingRequired.includes(envVar.key) || 
                           result.placeholderValues.includes(envVar.key) || 
                           result.invalidFormats.includes(envVar.key);
            
            return (
              <div key={envVar.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-mono text-sm">{envVar.key}</div>
                  <div className="text-xs text-gray-600">{envVar.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  {envVar.required && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                  {hasError ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : info?.set ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-gray-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Details */}
      {result.errors.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 text-red-600">Error Details</h4>
          <div className="bg-red-50 p-3 rounded text-sm font-mono space-y-1">
            {result.errors.map((error, index) => (
              <div key={index} className="text-red-700">{error}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};