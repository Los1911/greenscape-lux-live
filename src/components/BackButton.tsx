import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigateBack } from '@/utils/navigationHelpers';

interface BackButtonProps {
  className?: string;
  fallbackPath?: string;
}

export default function BackButton({ className = '', fallbackPath }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      navigateBack(navigate, location.pathname);
    }
  };

  return (
    <Button
      onClick={handleBack}
      variant="ghost"
      size="sm"
      className={`
        flex items-center gap-2 text-emerald-400 hover:text-emerald-300 
        hover:bg-emerald-500/10 border border-emerald-500/30 
        hover:border-emerald-400/50 transition-all duration-300
        backdrop-blur-sm bg-gray-900/20 shadow-lg shadow-emerald-500/10
        hover:shadow-emerald-400/20 ${className}
      `}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="font-medium">Back</span>
    </Button>
  );
}