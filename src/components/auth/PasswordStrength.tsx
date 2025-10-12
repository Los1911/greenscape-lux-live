import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    
    if (score <= 1) return { level: 'weak', color: 'bg-red-500', text: 'Weak' };
    if (score <= 3) return { level: 'medium', color: 'bg-yellow-500', text: 'Medium' };
    return { level: 'strong', color: 'bg-emerald-500', text: 'Strong' };
  };

  if (!password) return null;

  const strength = getStrength(password);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${strength.color} transition-all duration-300`}
            style={{ 
              width: strength.level === 'weak' ? '33%' : strength.level === 'medium' ? '66%' : '100%',
              filter: strength.level === 'strong' ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))' : 'none'
            }}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength.level === 'weak' ? 'text-red-400' : 
          strength.level === 'medium' ? 'text-yellow-400' : 
          'text-emerald-400'
        }`}>
          {strength.text}
        </span>
      </div>
    </div>
  );
};