import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardRoute, isPublicRoute } from '@/utils/navigationHelpers';

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = "" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const isAuthenticated = !!user;
  
  // Auto-generate breadcrumbs if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // For authenticated users, start with their dashboard instead of Home
    const homePath = isAuthenticated ? getDashboardRoute(role) : '/';
    const homeLabel = isAuthenticated ? 'Dashboard' : 'Home';
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: homeLabel, path: homePath }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Convert path segments to readable labels
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        path: currentPath,
        isActive: isLast
      });
    });

    return breadcrumbs;
  };

  // Process provided items to make them auth-aware
  const processItems = (providedItems: BreadcrumbItem[]): BreadcrumbItem[] => {
    if (!isAuthenticated) return providedItems;
    
    return providedItems.map((item, index) => {
      // For authenticated users, replace "Home" with "Dashboard" and update path
      if (index === 0 && (item.label === 'Home' || item.path === '/')) {
        return {
          ...item,
          label: 'Dashboard',
          path: getDashboardRoute(role)
        };
      }
      return item;
    });
  };

  const breadcrumbItems = items ? processItems(items) : generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  // Handle click with auth-awareness
  const handleClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    
    // For authenticated users, don't allow navigation to public routes
    if (isAuthenticated && isPublicRoute(path)) {
      navigate(getDashboardRoute(role));
    } else {
      navigate(path);
    }
  };

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => (
        <div key={item.path} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          )}
          
          {item.isActive ? (
            <span className="text-gray-900 font-medium">
              {item.label}
            </span>
          ) : (
            <a
              href={item.path}
              onClick={(e) => handleClick(e, item.path)}
              className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              {index === 0 ? (
                <Home className="w-4 h-4" />
              ) : (
                item.label
              )}
            </a>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
