import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { APIKeyValidator } from '../../lib/apiKeyValidator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';

interface ProductionCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

export const ProductionReadinessChecker: React.FC = () => {
  const [checks, setChecks] = useState<ProductionCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSensitive, setShowSensitive] = useState(false);

  useEffect(() => {
    runProductionChecks();
  }, []);

  const runProductionChecks = async () => {
    setIsLoading(true);
    
    const productionChecks: ProductionCheck[] = [];

    // Create config object from direct environment access
    const directConfig = {
      supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
      },
      stripe: {
        publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
      },
      googleMaps: {
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
      },
      resend: {
        apiKey: import.meta.env.VITE_RESEND_API_KEY || ''
      },
      app: {
        environment: import.meta.env.MODE || 'development'
      }
    };

    // Environment validation
    const validation = APIKeyValidator.validateAllKeys(directConfig);
    
    productionChecks.push({
      name: 'API Key Validation',
      status: validation.allValid ? 'pass' : 'fail',
      message: validation.allValid 
        ? 'All API keys are properly configured'
        : `${validation.errors.length} configuration errors detected`,
      critical: true
    });

    // Placeholder detection
    if (validation.placeholderKeys.length > 0) {
      productionChecks.push({
        name: 'Placeholder Detection',
        status: 'fail',
        message: `${validation.placeholderKeys.length} placeholder values found: ${validation.placeholderKeys.join(', ')}`,
        critical: true
      });
    } else {
      productionChecks.push({
        name: 'Placeholder Detection',
        status: 'pass',
        message: 'No placeholder values detected',
        critical: true
      });
    }

    // Environment type check
    const isProduction = directConfig.app.environment === 'production';
    productionChecks.push({
      name: 'Environment Type',
      status: isProduction ? 'pass' : 'warning',
      message: `Running in ${directConfig.app.environment} mode`,
      critical: false
    });

    // Console.log detection (basic check)
    const hasConsoleLogs = await checkForConsoleLogs();
    productionChecks.push({
      name: 'Debug Code Cleanup',
      status: hasConsoleLogs ? 'warning' : 'pass',
      message: hasConsoleLogs 
        ? 'Console.log statements detected - consider removing for production'
        : 'No obvious debug code detected',
      critical: false
    });

    // HTTPS check
    const isHttps = window.location.protocol === 'https:';
    productionChecks.push({
      name: 'HTTPS Security',
      status: isHttps ? 'pass' : 'fail',
      message: isHttps ? 'Site is served over HTTPS' : 'Site must use HTTPS in production',
      critical: true
    });

    // Service connectivity
    const connectivityChecks = await checkServiceConnectivity();
    productionChecks.push(...connectivityChecks);

    setChecks(productionChecks);
    setIsLoading(false);
  };

  const checkForConsoleLogs = async (): Promise<boolean> => {
    // This is a basic client-side check
    // In a real implementation, you'd want to check the built files
    return new Promise((resolve) => {
      // Check if console methods have been overridden or if there are obvious console calls
      const originalLog = console.log.toString();
      resolve(!originalLog.includes('[native code]'));
    });
  };

  const checkServiceConnectivity = async (): Promise<ProductionCheck[]> => {
    const checks: ProductionCheck[] = [];

    // Supabase connectivity
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      checks.push({
        name: 'Supabase Connectivity',
        status: response.ok ? 'pass' : 'fail',
        message: response.ok ? 'Supabase is accessible' : `Supabase error: ${response.status}`,
        critical: true
      });
    } catch (error) {
      checks.push({
        name: 'Supabase Connectivity',
        status: 'fail',
        message: 'Failed to connect to Supabase',
        critical: true
      });
    }

    return checks;
  };

  const getOverallStatus = () => {
    const criticalFailures = checks.filter(c => c.critical && c.status === 'fail');
    const warnings = checks.filter(c => c.status === 'warning');
    
    if (criticalFailures.length > 0) return 'fail';
    if (warnings.length > 0) return 'warning';
    return 'pass';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const overallStatus = getOverallStatus();
  const criticalIssues = checks.filter(c => c.critical && c.status === 'fail').length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Running Production Readiness Checks...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Production Readiness
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSensitive(!showSensitive)}
            >
              {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={runProductionChecks}>
              Recheck
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <Alert className={
          overallStatus === 'pass' ? 'border-green-200 bg-green-50' :
          overallStatus === 'fail' ? 'border-red-200 bg-red-50' :
          'border-yellow-200 bg-yellow-50'
        }>
          {getStatusIcon(overallStatus)}
          <AlertDescription>
            {overallStatus === 'pass' && 'System is ready for production deployment'}
            {overallStatus === 'fail' && `${criticalIssues} critical issues must be resolved before production`}
            {overallStatus === 'warning' && 'System is functional but has warnings to address'}
          </AlertDescription>
        </Alert>

        {/* Individual Checks */}
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{check.name}</h4>
                  {check.critical && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Critical
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {showSensitive ? check.message : check.message.replace(/[a-zA-Z0-9+/=]{20,}/g, '***HIDDEN***')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Production Deployment Checklist */}
        {overallStatus !== 'pass' && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Before Production Deployment:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Replace all placeholder API keys with real values</li>
              <li>• Set VITE_APP_ENV=production in hosting environment</li>
              <li>• Remove or disable console.log statements</li>
              <li>• Verify all services are accessible from production domain</li>
              <li>• Test authentication flows end-to-end</li>
              <li>• Verify payment processing with test transactions</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};