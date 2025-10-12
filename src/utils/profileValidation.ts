// Comprehensive validation utilities for profile forms
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

// Phone number formatting and validation
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length >= 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  // Partial formatting for incomplete numbers
  if (cleaned.length >= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length >= 3) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  }
  
  return cleaned;
};

export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length !== 10) {
    return { isValid: false, error: 'Phone number must be 10 digits' };
  }
  
  // Check for valid area code (not starting with 0 or 1)
  if (cleaned[0] === '0' || cleaned[0] === '1') {
    return { isValid: false, error: 'Invalid area code' };
  }
  
  return { isValid: true };
};

// Name validation
export const validateName = (name: string, fieldName: string): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: `${fieldName} must be less than 50 characters` };
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: `${fieldName} contains invalid characters` };
  }
  
  return { isValid: true };
};

// Address validation
export const validateAddress = (address: string): ValidationResult => {
  if (!address.trim()) {
    return { isValid: false, error: 'Service address is required' };
  }
  
  if (address.trim().length < 10) {
    return { isValid: false, error: 'Please provide a complete address' };
  }
  
  if (address.trim().length > 200) {
    return { isValid: false, error: 'Address is too long' };
  }
  
  // Basic address format check (should contain numbers and letters)
  const hasNumbers = /\d/.test(address);
  const hasLetters = /[a-zA-Z]/.test(address);
  
  if (!hasNumbers || !hasLetters) {
    return { isValid: false, error: 'Please provide a valid street address' };
  }
  
  return { isValid: true };
};

// Comprehensive form validation
export const validateProfileForm = (data: ProfileFormData): { 
  isValid: boolean; 
  errors: Partial<Record<keyof ProfileFormData, string>> 
} => {
  const errors: Partial<Record<keyof ProfileFormData, string>> = {};
  
  const firstNameResult = validateName(data.firstName, 'First name');
  if (!firstNameResult.isValid) {
    errors.firstName = firstNameResult.error;
  }
  
  const lastNameResult = validateName(data.lastName, 'Last name');
  if (!lastNameResult.isValid) {
    errors.lastName = lastNameResult.error;
  }
  
  const phoneResult = validatePhoneNumber(data.phone);
  if (!phoneResult.isValid) {
    errors.phone = phoneResult.error;
  }
  
  const addressResult = validateAddress(data.address);
  if (!addressResult.isValid) {
    errors.address = addressResult.error;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};