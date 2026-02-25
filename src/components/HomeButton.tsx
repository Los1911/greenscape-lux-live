import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HomeButtonProps {
  className?: string;
}

export default function HomeButton({ className = '' }: HomeButtonProps) {
  const navigate = useNavigate();

  const handleHome = () => {
    navigate('/');
  };

  return (
    <Button
      onClick={handleHome}
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
      <Home className="h-4 w-4" />
      <span className="font-medium">Home</span>
    </Button>
  );
}
