import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigateBack } from '@/utils/navigationHelpers';

interface StandardizedBackButtonProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fallbackPath?: string;
  showText?: boolean;
  customText?: string;
}

export default function StandardizedBackButton({ 
  className = '',
  variant = 'ghost',
  size = 'sm',
  fallbackPath,
  showText = true,
  customText = 'Back'
}: StandardizedBackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      navigateBack(navigate, location.pathname);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const baseClasses = `
    flex items-center gap-2 text-emerald-400 hover:text-emerald-300 
    hover:bg-emerald-500/10 border border-emerald-500/30 
    hover:border-emerald-400/50 transition-all duration-300
    backdrop-blur-sm bg-gray-900/20 shadow-lg shadow-emerald-500/10
    hover:shadow-emerald-400/20 ${sizeClasses[size]} ${className}
  `;

  return (
    <Button
      onClick={handleBack}
      variant={variant}
      className={baseClasses}
    >
      <ArrowLeft className="h-4 w-4" />
      {showText && <span className="font-medium">{customText}</span>}
    </Button>
  );
}