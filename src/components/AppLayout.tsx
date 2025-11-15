import React from 'react';
import { MultiEnvironmentValidator } from '@/components/setup/MultiEnvironmentValidator';
import { useMultiEnvironmentValidation } from '@/hooks/useMultiEnvironmentValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Settings, Zap } from 'lucide-react';

const AppLayout: React.FC = () => {
  const {
    validationResult,
    isLoading,
    environment,
    isValid,
    hasErrors,
    hasWarnings,
    errorCount,
    warningCount
  } = useMultiEnvironmentValidation();

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return 'text-red-600 bg-red-100';
      case 'staging': return 'text-yellow-600 bg-yellow-100';
      case 'development': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">

      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Multi-Environment Config Manager
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Advanced configuration management system that handles different sets of environment variables 
            for development, staging, and production environments with validation rules specific to each environment type.
          </p>
        </div>

        {/* Quick Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                environment === 'production' ? 'bg-red-100' : 
                environment === 'staging' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <Settings className={`h-8 w-8 ${
                  environment === 'production' ? 'text-red-600' : 
                  environment === 'staging' ? 'text-yellow-600' : 'text-green-600'
                }`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{environment.toUpperCase()}</div>
              <div className="text-sm text-gray-600">Current Environment</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isValid ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isValid ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div className={`text-2xl font-bold mb-1 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                {isValid ? 'VALID' : 'INVALID'}
              </div>
              <div className="text-sm text-gray-600">Validation Status</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">{errorCount}</div>
              <div className="text-sm text-gray-600">Critical Errors</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600 mb-1">{warningCount}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </CardContent>
          </Card>
        </div>

        {/* Environment-Specific Info */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getEnvironmentColor(environment)}`}>
                <Settings className="h-5 w-5" />
              </div>
              {environment.charAt(0).toUpperCase() + environment.slice(1)} Environment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Environment Type</div>
                <Badge className={`${getEnvironmentColor(environment)} border-0 text-lg px-4 py-2`}>
                  {environment.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Security Level</div>
                <Badge variant={environment === 'production' ? 'destructive' : 'secondary'} className="text-lg px-4 py-2">
                  {environment === 'production' ? 'MAXIMUM' : environment === 'staging' ? 'HIGH' : 'STANDARD'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Key Requirements</div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {environment === 'production' ? 'LIVE KEYS' : 'TEST KEYS'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Validator */}
        <MultiEnvironmentValidator />

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/70 backdrop-blur-sm rounded-full border shadow-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              Multi-Environment Configuration System Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;