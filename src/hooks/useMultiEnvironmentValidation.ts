import { useState, useEffect, useCallback } from 'react';
import { multiEnvConfig, ValidationResult, Environment } from '@/lib/multiEnvConfig';

export interface UseMultiEnvironmentValidationReturn {
  validationResult: ValidationResult | null;
  isLoading: boolean;
  environment: Environment;
  revalidate: () => void;
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
}

export const useMultiEnvironmentValidation = (): UseMultiEnvironmentValidationReturn => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const validateEnvironment = useCallback(() => {
    setIsLoading(true);
    
    // Simulate async validation (could be actual async in the future)
    setTimeout(() => {
      try {
        const result = multiEnvConfig.validateEnvironment();
        setValidationResult(result);
      } catch (error) {
        console.error('Environment validation failed:', error);
        // Create a fallback result
        setValidationResult({
          isValid: false,
          environment: multiEnvConfig.getCurrentEnvironment(),
          errors: ['Environment validation failed'],
          warnings: [],
          missingRequired: [],
          invalidValues: {},
          placeholderValues: {}
        });
      } finally {
        setIsLoading(false);
      }
    }, 100);
  }, []);

  const revalidate = useCallback(() => {
    validateEnvironment();
  }, [validateEnvironment]);

  useEffect(() => {
    validateEnvironment();
  }, [validateEnvironment]);

  // Computed values
  const environment = multiEnvConfig.getCurrentEnvironment();
  const isValid = validationResult?.isValid ?? false;
  const hasErrors = (validationResult?.errors?.length ?? 0) > 0;
  const hasWarnings = (validationResult?.warnings?.length ?? 0) > 0;
  const errorCount = validationResult?.errors?.length ?? 0;
  const warningCount = validationResult?.warnings?.length ?? 0;

  return {
    validationResult,
    isLoading,
    environment,
    revalidate,
    isValid,
    hasErrors,
    hasWarnings,
    errorCount,
    warningCount
  };
};

// Hook for getting environment-specific configuration
export const useEnvironmentConfig = () => {
  const environment = multiEnvConfig.getCurrentEnvironment();
  const config = multiEnvConfig.getEnvironmentRequirements();
  
  return {
    environment,
    config,
    isProduction: environment === 'production',
    isStaging: environment === 'staging',
    isDevelopment: environment === 'development'
  };
};

// Hook for checking specific environment variables
export const useEnvironmentVariable = (variableName: string) => {
  const [value, setValue] = useState<string | undefined>(undefined);
  const [isRequired, setIsRequired] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const config = multiEnvConfig.getEnvironmentRequirements();
    const envValue = import.meta.env[variableName];
    const required = config.required.includes(variableName);
    const validator = config.validationRules[variableName];

    setValue(envValue);
    setIsRequired(required);

    if (required && !envValue) {
      setIsValid(false);
      setError(`${variableName} is required but not set`);
    } else if (envValue && validator && !validator(envValue)) {
      setIsValid(false);
      setError(config.errorMessages[variableName] || 'Invalid value');
    } else {
      setIsValid(true);
      setError(null);
    }
  }, [variableName]);

  return {
    value,
    isRequired,
    isValid,
    error,
    hasValue: !!value
  };
};