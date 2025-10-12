import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { multiEnvConfig, ValidationResult, Environment } from '@/lib/multiEnvConfig';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Settings } from 'lucide-react';

export const MultiEnvironmentValidator: React.FC = () => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const validateEnvironment = () => {
    setIsLoading(true);
    setTimeout(() => {
      const result = multiEnvConfig.validateEnvironment();
      setValidationResult(result);
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    validateEnvironment();
  }, []);

  const getEnvironmentBadgeVariant = (env: Environment) => {
    switch (env) {
      case 'production': return 'destructive';
      case 'staging': return 'secondary';
      case 'development': return 'default';
    }
  };

  const getStatusIcon = (isValid: boolean) => {
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    return isValid ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Validation
            <RefreshCw className="h-4 w-4 animate-spin" />
          </CardTitle>
          <CardDescription>Validating environment configuration...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!validationResult) return null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Environment Configuration Status
              {getStatusIcon(validationResult.isValid)}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getEnvironmentBadgeVariant(validationResult.environment)}>
                {validationResult.environment.toUpperCase()}
              </Badge>
              <Button onClick={validateEnvironment} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Revalidate
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Multi-environment validation for {validationResult.environment} environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!validationResult.isValid && (
            <Alert className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Environment validation failed. Please fix the issues below before proceeding.
              </AlertDescription>
            </Alert>
          )}

          {validationResult.isValid && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All environment variables are properly configured for {validationResult.environment}!
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="errors">Errors ({validationResult.errors.length})</TabsTrigger>
              <TabsTrigger value="warnings">Warnings ({validationResult.warnings.length})</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Environment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={getEnvironmentBadgeVariant(validationResult.environment)} className="text-lg">
                      {validationResult.environment.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(validationResult.isValid)}
                      <span className={validationResult.isValid ? 'text-green-600' : 'text-red-600'}>
                        {validationResult.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {validationResult.errors.length + validationResult.warnings.length}
                    </div>
                    <div className="text-sm text-gray-500">
                      {validationResult.errors.length} errors, {validationResult.warnings.length} warnings
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              {validationResult.errors.length === 0 ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    No errors found! All required environment variables are properly configured.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {validationResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {validationResult.missingRequired.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Missing Required Variables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {validationResult.missingRequired.map((varName) => (
                        <Badge key={varName} variant="destructive">{varName}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {Object.keys(validationResult.placeholderValues).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Placeholder Values Detected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(validationResult.placeholderValues).map(([varName, value]) => (
                        <div key={varName} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                          <Badge variant="secondary">{varName}</Badge>
                          <code className="text-sm text-orange-700">{value}</code>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="warnings" className="space-y-4">
              {validationResult.warnings.length === 0 ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    No warnings! Optional environment variables are properly configured.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {validationResult.warnings.map((warning, index) => (
                    <Alert key={index} className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Required Variables</CardTitle>
                    <CardDescription>
                      These variables must be set for {validationResult.environment} environment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {multiEnvConfig.getEnvironmentRequirements().required.map((varName) => {
                        const hasValue = import.meta.env[varName];
                        return (
                          <div key={varName} className="flex items-center justify-between p-2 rounded border">
                            <code className="text-sm">{varName}</code>
                            {hasValue ? 
                              <CheckCircle className="h-4 w-4 text-green-500" /> : 
                              <XCircle className="h-4 w-4 text-red-500" />
                            }
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">Optional Variables</CardTitle>
                    <CardDescription>
                      These variables are optional but recommended for {validationResult.environment}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {multiEnvConfig.getEnvironmentRequirements().optional.map((varName) => {
                        const hasValue = import.meta.env[varName];
                        return (
                          <div key={varName} className="flex items-center justify-between p-2 rounded border">
                            <code className="text-sm">{varName}</code>
                            {hasValue ? 
                              <CheckCircle className="h-4 w-4 text-green-500" /> : 
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            }
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};