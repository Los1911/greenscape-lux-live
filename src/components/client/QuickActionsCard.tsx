import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, History, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsCardProps {
  onRequestService?: () => void;
  onScheduleService?: () => void;
  onContactSupport?: () => void;
  onManagePayments?: () => void;
  onViewInvoices?: () => void;
  onAccountSettings?: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = () => {
  const navigate = useNavigate();

  const handleEditProfile = () => {
    navigate('/profile');
  };

  const handleViewHistory = () => {
    navigate('/client-history');
  };

  const handleLiveChat = () => {
    navigate('/chat');
  };
  
  const quickActions = [
    {
      id: 'edit-profile',
      label: 'Edit Profile',
      icon: <Edit3 className="h-4 w-4" />,
      onClick: handleEditProfile,
    },
    {
      id: 'view-history',
      label: 'View History',
      icon: <History className="h-4 w-4" />,
      onClick: handleViewHistory,
    },
    {
      id: 'live-chat',
      label: 'Live Chat',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: handleLiveChat,
    },
  ];

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Edit3 className="h-3 w-3 text-emerald-400" />
          </div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick || (() => console.log(`${action.label} clicked`))}
            className="flex items-center gap-3 text-gray-400 hover:text-emerald-400 transition-colors text-xs py-2 px-1 rounded-md hover:bg-gray-800/30 w-full text-left focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-gray-900"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              {action.icon}
            </div>
            <span>{action.label}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
};