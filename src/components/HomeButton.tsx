import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HomeButtonProps {
  className?: string;
}

/**
 * HomeButton — Navigates to home page
 *
 * SAFARI COMPOSITING FIX:
 * - Removed `backdrop-blur-sm` which created a backdrop-filter compositing layer.
 *   On iOS Safari, backdrop-filter forces the GPU to sample all layers behind the
 *   element, which can cause the diagonal AnimatedBackground gradient to "punch
 *   through" the login card when both share the same stacking context.
 * - Replaced `bg-gray-900/20` (20% opacity) with solid `bg-gray-900` to eliminate
 *   any transparency that could allow background bleed-through.
 * - Visual appearance is preserved: same border, shadow, hover states.
 */
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
        bg-gray-900 shadow-lg shadow-emerald-500/10
        hover:shadow-emerald-400/20 ${className}
      `}
    >
      <Home className="h-4 w-4" />
      <span className="font-medium">Home</span>
    </Button>
  );
}
