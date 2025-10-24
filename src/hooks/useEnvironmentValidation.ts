import { useEffect, useState } from 'react';
import { envValidator, ValidationResult } from '@/lib/envValidation';

export interface UseEnvironmentValidationOptions {
  validateOnMount?: boolean;
  showConsoleWarnings?: boolean;
  onValidationComplete?: (result: ValidationResult) => void;
}

export const useEnvironmentValidation = (options: UseEnvironmentValidationOptions = {}) => {
  const {
    validateOnMount = true,
    showConsoleWarnings = true,
    onValidationComplete
  } = options;

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

  const validate = async () => {
    setIsValidating(true);
    
    try {
      const result = envValidator.validateRuntime();
      setValidationResult(result);
      setLastValidated(new Date());
      
      if (showConsoleWarnings && !result.valid) {
        console.group('🔍 Environment Validation Issues');
        result.errors.forEach(error => console.warn(error));
        console.groupEnd();
      }
      
      onValidationComplete?.(result);
      return result;
    } catch (error) {
      console.error('Environment validation error:', error);
      const errorResult: ValidationResult = {
        valid: false,
        errors: ['Validation failed due to internal error'],
        warnings: [],
        missingRequired: [],
        placeholderValues: [],
        invalidFormats: []
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  };

  const getEnvironmentInfo = () => {
    return envValidator.getEnvironmentInfo();
  };

  const isValid = validationResult?.valid ?? null;
  const hasErrors = validationResult ? validationResult.errors.length > 0 : false;
  const hasWarnings = validationResult ? validationResult.warnings.length > 0 : false;

  useEffect(() => {
    if (validateOnMount) {
      validate();
    }
  }, [validateOnMount]);

  return {
    // State
    validationResult,
    isValidating,
    lastValidated,
    isValid,
    hasErrors,
    hasWarnings,
    
    // Actions
    validate,
    getEnvironmentInfo,
    
    // Computed values
    errorCount: validationResult?.errors.length ?? 0,
    warningCount: validationResult?.warnings.length ?? 0,
    missingRequiredCount: validationResult?.missingRequired.length ?? 0,
    placeholderCount: validationResult?.placeholderValues.length ?? 0
  };
};