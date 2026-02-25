import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Eye, Wallet } from 'lucide-react';

interface PayoutRecord {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing';
  jobsCount: number;
  method: string;
}

interface PayoutHistoryProps {
  payouts?: PayoutRecord[];
}

const mockPayouts: PayoutRecord[] = [
  { id: '1', date: '2024-01-15', amount: 1250.00, status: 'completed', jobsCount: 5, method: 'Bank Transfer' },
  { id: '2', date: '2024-01-01', amount: 890.50, status: 'completed', jobsCount: 3, method: 'Bank Transfer' },
  { id: '3', date: '2023-12-15', amount: 1450.00, status: 'completed', jobsCount: 6, method: 'Bank Transfer' },
  { id: '4', date: '2023-12-01', amount: 750.25, status: 'completed', jobsCount: 2, method: 'Bank Transfer' },
  { id: '5', date: '2023-11-15', amount: 2100.00, status: 'completed', jobsCount: 8, method: 'Bank Transfer' }
];

export default function PayoutHistory({ payouts }: PayoutHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const payoutData = payouts || mockPayouts;

  const filteredPayouts = payoutData.filter(payout => 
    filter === 'all' || payout.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-900/50 text-emerald-400 border-emerald-700';
      case 'pending': return 'bg-amber-900/50 text-amber-400 border-amber-700';
      case 'processing': return 'bg-blue-900/50 text-blue-400 border-blue-700';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const handleDownloadStatement = (payoutId: string) => {
    console.log('Downloading statement for payout:', payoutId);
    alert(`Downloading statement for payout ${payoutId}`);
  };

  const handleViewDetails = (payoutId: string) => {
    console.log('Viewing details for payout:', payoutId);
    alert(`Viewing details for payout ${payoutId}`);
  };

  // Empty state
  if (payoutData.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-slate-400" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <Wallet className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-slate-400">
              Complete your first job to start earning and unlock higher tiers.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Your payout history will appear here once you start receiving payments.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-slate-400" />
            Payout History
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
              }
            >
              All
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
              className={filter === 'completed' 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
              }
            >
              Completed
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
              className={filter === 'pending' 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
              }
            >
              Pending
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredPayouts.map((payout) => (
            <div 
              key={payout.id} 
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-lg text-white">${payout.amount.toLocaleString()}</span>
                  <Badge className={getStatusColor(payout.status)}>
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-sm text-slate-400">
                  <p>{new Date(payout.date).toLocaleDateString()} • {payout.jobsCount} jobs • {payout.method}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(payout.id)}
                  className="flex items-center gap-1 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Details</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadStatement(payout.id)}
                  className="flex items-center gap-1 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
