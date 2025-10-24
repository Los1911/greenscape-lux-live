import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Route consolidation component for quote routes
export const QuoteRouteConsolidator: React.FC = () => {
  return <Navigate to="/get-quote" replace />;
};

// Smart dashboard router based on user role
export const DashboardRouter: React.FC = () => {
  const { user, role: userRole } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to role selection
  if (!user) {
    return <Navigate to="/auth/select-role" state={{ from: location }} replace />;
  }

  // Route based on user role
  switch (userRole) {
    case 'client':
      return <Navigate to="/client-dashboard" replace />;
    case 'landscaper':
      return <Navigate to="/landscaper-dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin-dashboard" replace />;
    default:
      return <Navigate to="/auth/select-role" state={{ from: location }} replace />;
  }
};

// Role selection page for generic auth routes
export const RoleSelector: React.FC = () => {
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleRoleSelection = (role: 'client' | 'landscaper') => {
    const loginPath = role === 'client' ? '/client-login' : '/pro-login';
    window.location.href = `${loginPath}?redirect=${encodeURIComponent(from)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to GreenScape Lux</h1>
          <p className="text-gray-600">Choose your account type to continue</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelection('client')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-3"
          >
            <span>🏡</span>
            <span>I'm a Property Owner</span>
          </button>

          <button
            onClick={() => handleRoleSelection('landscaper')}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-3"
          >
            <span>🌿</span>
            <span>I'm a Landscaping Professional</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? <a href="mailto:support@greenscapelux.com" className="text-emerald-600 hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
};