import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { ValidationResult, validateField, ValidationRule } from '@/utils/formValidation';

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  validationRules?: ValidationRule;
  error?: string;
  touched?: boolean;
  showValidation?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  validationRules,
  error,
  touched = false,
  showValidation = true,
  className
}) => {
  const [localError, setLocalError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // Real-time validation
  useEffect(() => {
    if (showValidation && touched && value !== undefined) {
      const rules = validationRules || { required };
      const result = validateField(value, rules, label);
      
      setLocalError(result.error || '');
      setIsValid(result.isValid);
    }
  }, [value, touched, required, validationRules, label, showValidation]);

  const displayError = error || localError;
  const showError = touched && displayError;
  const showSuccess = touched && isValid && !displayError && value.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const inputClassName = cn(
    "transition-all duration-200",
    showError && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
    showSuccess && "border-green-500 focus:border-green-500 focus:ring-green-500/20",
    !showError && !showSuccess && "border-gray-300 dark:border-gray-600",
    className
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={4}
          className={cn(
            "w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border rounded-full",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "text-gray-900 dark:text-gray-100",
            inputClassName
          )}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClassName}
        />
      )}
      
      {/* Error Message */}
      {showError && (
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-500">{displayError}</p>
        </div>
      )}
      
      {/* Success Message */}
      {showSuccess && (
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-green-500">Valid</p>
        </div>
      )}
    </div>
  );
};