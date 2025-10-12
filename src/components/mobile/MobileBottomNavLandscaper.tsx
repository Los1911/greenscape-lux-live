import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, DollarSign, User } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
}

const MobileBottomNavLandscaper: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: Home, path: '/landscaper-dashboard/overview' },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, path: '/landscaper-dashboard/jobs', badge: 3 },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, path: '/landscaper-dashboard/earnings' },
    { id: 'profile', label: 'Profile', icon: User, path: '/landscaper-dashboard/profile' }
  ];

  useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = navItems.find(item => item.path === currentPath);
    if (currentItem) {
      setActiveTab(currentItem.id);
    }
  }, [location.pathname]);

  const handleTabPress = (itemId: string) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    setActiveTab(itemId);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-emerald-500/20 z-50 md:hidden shadow-[0_-4px_20px_rgba(52,211,153,0.15)]">
      <div className="flex justify-around items-center py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'text-emerald-400' 
                  : 'text-emerald-200/50 hover:text-emerald-300 active:bg-emerald-500/10'
              }`}
              onTouchStart={() => handleTabPress(item.id)}
              onClick={() => handleTabPress(item.id)}
            >
              <div className="relative">
                <Icon 
                  size={24} 
                  className={`transition-all duration-300 ${
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'scale-100'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-red-500/50">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium truncate transition-all duration-300 ${
                isActive ? 'text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.6)]' : 'text-emerald-200/50'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNavLandscaper;
