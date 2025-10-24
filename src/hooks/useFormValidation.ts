import { useState, useCallback, useEffect } from 'react';
import { ValidationRule, validateForm, FormErrors, FormTouched } from '@/utils/formValidation';

interface UseFormValidationProps {
  initialValues: Record<string, string>;
  validationRules: Record<string, ValidationRule>;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}

interface UseFormValidationReturn {
  values: Record<string, string>;
  errors: FormErrors;
  touched: FormTouched;
  isSubmitting: boolean;
  isValid: boolean;
  submitError: string | null;
  setValue: (name: string, value: string) => void;
  setFieldTouched: (name: string, isTouched?: boolean) => void;
  setFieldError: (name: string, error: string) => void;
  clearErrors: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
}

export const useFormValidation = ({
  initialValues,
  validationRules,
  onSubmit
}: UseFormValidationProps): UseFormValidationReturn => {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validate form and update errors
  const validateFormData = useCallback(() => {
    const newErrors = validateForm(values, validationRules);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validationRules]);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 && Object.keys(touched).length > 0;

  // Set individual field value
  const setValue = useCallback((name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError(null);
    }
  }, [submitError]);

  // Set field as touched
  const setFieldTouched = useCallback((name: string, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  // Set field error
  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setSubmitError(null);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Mark all fields as touched
    const allTouched: FormTouched = {};
    Object.keys(validationRules).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate form
    const isFormValid = validateFormData();
    
    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } catch (error: any) {
      setSubmitError(error.message || 'An error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validationRules, validateFormData, onSubmit]);

  // Reset form to initial state
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitError(null);
  }, [initialValues]);

  // Validate form whenever values change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      validateFormData();
    }
  }, [values, touched, validateFormData]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    submitError,
    setValue,
    setFieldTouched,
    setFieldError,
    clearErrors,
    handleSubmit,
    reset
  };
};