import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormValidationProps {
  onSubmit: (data: FormData) => Promise<void>;
  fields: FormField[];
  title: string;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'textarea';
  required?: boolean;
  validation?: (value: string) => string | null;
}

interface FormData {
  [key: string]: string;
}

export const FormValidation: React.FC<FormValidationProps> = ({ onSubmit, fields, title }) => {
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateField = (field: FormField, value: string): string | null => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }
    
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }
    
    if (field.validation) {
      return field.validation(value);
    }
    
    return null;
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    // Validate all fields
    const newErrors: {[key: string]: string} = {};
    fields.forEach(field => {
      const error = validateField(field, formData[field.name] || '');
      if (error) {
        newErrors[field.name] = error;
      }
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error: any) {
      setSubmitError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      
      {fields.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {field.label} {field.required && <span className="text-red-400">*</span>}
          </label>
          
          {field.type === 'textarea' ? (
            <textarea
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`w-full px-3 py-2 bg-gray-800 border rounded-md text-white ${
                errors[field.name] ? 'border-red-500' : 'border-gray-600'
              }`}
              rows={4}
            />
          ) : (
            <Input
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`bg-gray-800 border-gray-600 text-white ${
                errors[field.name] ? 'border-red-500' : ''
              }`}
            />
          )}
          
          {errors[field.name] && (
            <p className="text-red-400 text-sm mt-1">{errors[field.name]}</p>
          )}
        </div>
      ))}
      
      {submitError && (
        <Alert className="border-red-500 bg-red-900/20">
          <AlertDescription className="text-red-400">
            {submitError}
          </AlertDescription>
        </Alert>
      )}
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
};