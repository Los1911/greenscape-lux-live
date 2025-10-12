import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Briefcase, DollarSign, User, Settings } from 'lucide-react';

const LandscaperNavigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/landscaper-dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview & Analytics'
    },
    {
      path: '/landscaper-jobs',
      label: 'Jobs',
      icon: Briefcase,
      description: 'Active & Upcoming Jobs'
    },
    {
      path: '/landscaper-earnings',
      label: 'Earnings',
      icon: DollarSign,
      description: 'Financial Analytics'
    },
    {
      path: '/landscaper-profile',
      label: 'Profile',
      icon: User,
      description: 'Account & Settings'
    }
  ];

  return (
    <nav className="w-full bg-black/40 backdrop-blur border border-green-500/20 rounded-2xl p-4 mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-green-500/20 text-green-200 border border-green-500/50 shadow-lg shadow-green-500/25'
                  : 'bg-black/30 text-green-300/70 border border-green-500/10 hover:bg-green-500/10 hover:text-green-200 hover:border-green-500/30'
              }`}
            >
              <Icon 
                className={`w-6 h-6 mb-2 transition-colors duration-200 ${
                  isActive ? 'text-green-200' : 'text-green-300/70 group-hover:text-green-200'
                }`} 
              />
              <span className={`font-medium text-sm transition-colors duration-200 ${
                isActive ? 'text-green-200' : 'text-green-300/70 group-hover:text-green-200'
              }`}>
                {item.label}
              </span>
              <span className={`text-xs mt-1 text-center transition-colors duration-200 ${
                isActive ? 'text-green-300/80' : 'text-green-400/50 group-hover:text-green-300/70'
              }`}>
                {item.description}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default LandscaperNavigation;