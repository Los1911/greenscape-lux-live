import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Plus, CheckCircle, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { UnifiedProfileManager } from './UnifiedProfileManager';

export const ProfileStatusCard: React.FC = () => {
  const navigate = useNavigate();
  const { percentage, items, loading } = useProfileCompletion();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleAddName = () => setShowProfileModal(true);
  const handleAddPhone = () => setShowProfileModal(true);
  const handleAddAddress = () => setShowProfileModal(true);
  const handleAddPayment = () => navigate('/profile#payment');

  const getActionHandler = (action?: string) => {
    switch (action) {
      case 'edit_profile': return handleAddName;
      case 'add_address': return handleAddAddress;
      case 'add_payment': return handleAddPayment;
      default: return () => {};
    }
  };

  const getActionLabel = (item: any) => {
    if (item.completed) return 'Complete';
    switch (item.action) {
      case 'edit_profile': return item.id === 'full_name' ? 'Add Name' : 'Add Phone';
      case 'add_address': return 'Add Address';
      case 'add_payment': return 'Add Payment Method';
      default: return 'Complete';
    }
  };

  const getBenefitText = (itemId: string) => {
    switch (itemId) {
      case 'full_name': return 'Personalized service experience and faster booking';
      case 'phone': return 'Real-time updates and direct communication with your landscaper';
      case 'address': return 'Accurate service quotes and scheduling for your location';
      case 'payment_method': return 'Seamless checkout and priority booking access';
      default: return 'Complete this step to enhance your service experience';
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            <div className="h-2 bg-gray-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gray-900/50 border-gray-800 transition-all duration-200 hover:bg-gray-900/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <User className="h-3 w-3 text-emerald-400" />
              </div>
              Profile Status
            </div>
            <span className="text-xs text-gray-400">Getting Started</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Profile Completion</span>
              <span className="text-sm text-white font-medium">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {item.completed ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
                    )}
                    <span className={`text-sm ${item.completed ? 'text-white' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                  </div>
                  {!item.completed && item.action && (
                    <button 
                      onClick={getActionHandler(item.action)}
                      className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded px-2 py-1"
                      aria-label={`${getActionLabel(item)} to improve your profile`}
                    >
                      <Plus className="h-3 w-3" />
                      {getActionLabel(item)}
                    </button>
                  )}
                </div>
                {!item.completed && (
                  <p className="text-xs text-gray-500 ml-6 leading-relaxed">
                    {getBenefitText(item.id)}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gradient-to-br from-gray-800/50 to-gray-800/30 rounded-lg border border-gray-700/50">
            <div className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Why Complete Your Profile?
            </div>
            <ul className="text-xs text-gray-400 space-y-1.5 leading-relaxed">
              <li>• <span className="text-emerald-400">Faster</span> service booking and scheduling</li>
              <li>• <span className="text-emerald-400">Personalized</span> service recommendations</li>
              <li>• <span className="text-emerald-400">Priority</span> customer support access</li>
              <li>• <span className="text-emerald-400">Exclusive</span> member discounts and offers</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Complete Your Profile</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                aria-label="Close profile modal"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <UnifiedProfileManager 
                profile={{
                  firstName: '', // Will be loaded from actual profile data
                  lastName: '',
                  phone: '',
                  address: '',
                  paymentMethod: false
                }} 
                onProfileUpdate={() => {
                  setShowProfileModal(false);
                  // Profile completion hook will automatically refresh
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};