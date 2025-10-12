// Developer Note: Enhanced StandardizedButton with single-line labels, dark theme glow, accessible focus rings, and loading states

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface StandardizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label: string; // Required single-line label
  description?: string; // Optional but NOT rendered inside button
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
}

export function StandardizedButton({ 
  variant = 'primary', 
  size = 'md', 
  label,
  description, // Not used in rendering - for external use only
  className, 
  onClick, 
  disabled, 
  loading = false,
  type = 'button',
  icon,
  ...props 
}: StandardizedButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 glow-emerald hover:glow-emerald-strong focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
      case 'secondary':
        return 'bg-gray-700 hover:bg-gray-600 text-white border-gray-700 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
      case 'outline':
        return 'border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 bg-transparent focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
      case 'ghost':
        return 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 bg-transparent border-transparent focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
      default:
        return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 glow-emerald hover:glow-emerald-strong focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm h-8';
      case 'lg':
        return 'px-6 py-3 text-lg h-12';
      default:
        return 'px-4 py-2 text-base h-10';
    }
  };

  const isDisabled = disabled || loading;

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={label}
      className={cn(
        'font-medium rounded-lg transition-all duration-200 flex items-center gap-2 focus-visible:outline-none',
        'whitespace-nowrap truncate leading-tight', // Enforce single line
        getVariantStyles(),
        getSizeStyles(),
        isDisabled && 'opacity-50 cursor-not-allowed transform-none shadow-none',
        loading && 'pointer-events-none',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon && icon
      )}
      <span className="whitespace-nowrap truncate leading-tight">{label}</span>
    </Button>
  );
}