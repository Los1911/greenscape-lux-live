import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Eye, Filter } from 'lucide-react';

interface PayoutRecord {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing';
  jobsCount: number;
  method: string;
}

const mockPayouts: PayoutRecord[] = [
  { id: '1', date: '2024-01-15', amount: 1250.00, status: 'completed', jobsCount: 5, method: 'Bank Transfer' },
  { id: '2', date: '2024-01-01', amount: 890.50, status: 'completed', jobsCount: 3, method: 'Bank Transfer' },
  { id: '3', date: '2023-12-15', amount: 1450.00, status: 'completed', jobsCount: 6, method: 'Bank Transfer' },
  { id: '4', date: '2023-12-01', amount: 750.25, status: 'completed', jobsCount: 2, method: 'Bank Transfer' },
  { id: '5', date: '2023-11-15', amount: 2100.00, status: 'completed', jobsCount: 8, method: 'Bank Transfer' }
];

export default function PayoutHistory() {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const filteredPayouts = mockPayouts.filter(payout => 
    filter === 'all' || payout.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadStatement = (payoutId: string) => {
    console.log('Downloading statement for payout:', payoutId);
    // Simulate download
    alert(`Downloading statement for payout ${payoutId}`);
  };

  const handleViewDetails = (payoutId: string) => {
    console.log('Viewing details for payout:', payoutId);
    alert(`Viewing details for payout ${payoutId}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payout History
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredPayouts.map((payout) => (
            <div key={payout.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-lg">${payout.amount.toLocaleString()}</span>
                  <Badge className={getStatusColor(payout.status)}>
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{new Date(payout.date).toLocaleDateString()} • {payout.jobsCount} jobs • {payout.method}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(payout.id)}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadStatement(payout.id)}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}