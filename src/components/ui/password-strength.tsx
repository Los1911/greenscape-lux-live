import React from 'react';
import { getPasswordStrength } from '@/utils/formValidation';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  className
}) => {
  const { score, label, color } = getPasswordStrength(password);
  
  if (!password) return null;

  const strengthBars = Array.from({ length: 4 }, (_, index) => (
    <div
      key={index}
      className={cn(
        'h-1 rounded-full transition-all duration-300',
        index < score / 1.5 
          ? score <= 2 
            ? 'bg-red-500' 
            : score <= 4 
            ? 'bg-yellow-500' 
            : 'bg-green-500'
          : 'bg-gray-300 dark:bg-gray-600'
      )}
    />
  ));

  const requirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[a-z]/.test(password), text: 'Lowercase letter' },
    { met: /[A-Z]/.test(password), text: 'Uppercase letter' },
    { met: /[0-9]/.test(password), text: 'Number' },
    { met: /[^A-Za-z0-9]/.test(password), text: 'Special character' }
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Password strength</span>
          <span className={cn('text-sm font-medium', color)}>{label}</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {strengthBars}
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-1">
        <p className="text-xs text-gray-600 dark:text-gray-400">Password must contain:</p>
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className={cn(
              'w-3 h-3 rounded-full flex items-center justify-center',
              req.met ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            )}>
              {req.met && (
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={cn(
              'text-xs',
              req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
            )}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};