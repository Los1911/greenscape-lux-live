import React, { useState, useEffect } from 'react';
import { secureConfig, ConfigValidation } from '@/lib/secureConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityGateProps {
  children: React.ReactNode;
  showWarnings?: boolean;
}

export const SecurityGate: React.FC<SecurityGateProps> = ({ 
  children, 
  showWarnings = true 
}) => {
  const [validation, setValidation] = useState<ConfigValidation | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const result = secureConfig.getValidation();
    setValidation(result);
  }, []);

  if (!validation) {
    return <div>Loading...</div>;
  }

  // Always render children - never block the app
  return (
    <div>
      {/* Optional security status banner */}
      {showWarnings && !validation.isValid && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Some features may be limited due to missing API keys
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-yellow-700 hover:text-yellow-800"
            >
              {showDetails ? 'Hide' : 'Details'}
            </Button>
          </div>
          
          {showDetails && (
            <div className="max-w-7xl mx-auto mt-3 p-3 bg-white rounded border">
              <div className="space-y-2">
                {validation.missing.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                      Missing Configuration
                    </h4>
                    <ul className="text-sm text-gray-600 ml-5">
                      {validation.missing.map(key => (
                        <li key={key}>• {key}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validation.usingFallbacks.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Shield className="h-4 w-4 mr-1 text-blue-500" />
                      Using Fallback Configuration
                    </h4>
                    <ul className="text-sm text-gray-600 ml-5">
                      {validation.usingFallbacks.map(key => (
                        <li key={key}>• {key}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Always render the main content */}
      {children}
    </div>
  );
};