import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigateBackContextAware } from '@/utils/navigationHelpers';

interface GlobalNavigationProps {
  showBack?: boolean;
  showHome?: boolean;
  showClose?: boolean;
  customBackPath?: string;
  onClose?: () => void;
  className?: string;
}

const GlobalNavigation: React.FC<GlobalNavigationProps> = ({
  showBack = true,
  showHome = true,
  showClose = false,
  customBackPath,
  onClose,
  className = ""
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = async () => {
    // Use custom path if provided
    if (customBackPath) {
      navigate(customBackPath);
      return;
    }
    
    // Use context-aware navigation based on user role and location
    await navigateBackContextAware(navigate, location.pathname);
  };

  const handleHome = () => {
    navigate('/');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  // Don't show on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showBack && (
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      )}
      
      {showHome && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHome}
          className="text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Home className="w-4 h-4 mr-1" />
          Home
        </Button>
      )}

      {showClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <X className="w-4 h-4 mr-1" />
          Close
        </Button>
      )}
    </div>
  );
};

export default GlobalNavigation;
