import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Receipt, CreditCard } from 'lucide-react';

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: string;
  invoice_url?: string;
}

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentHistoryModal({ isOpen, onClose }: PaymentHistoryModalProps) {
  // Mock payment data - replace with real data
  const payments: Payment[] = [
    {
      id: 'PAY-001',
      date: '2024-01-15',
      amount: 350,
      method: 'Credit Card',
      status: 'completed',
      invoice_url: '#'
    },
    {
      id: 'PAY-002', 
      date: '2024-02-20',
      amount: 275,
      method: 'Bank Transfer',
      status: 'completed',
      invoice_url: '#'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-400';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'failed':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border border-green-500/25 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-green-300">Payment History</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {payments.map((payment) => (
            <Card key={payment.id} className="bg-black/40 border border-green-500/20 p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-green-400" />
                    <span className="font-medium">Payment #{payment.id}</span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(payment.date).toLocaleDateString()} • {payment.method}
                  </div>
                  <div className="text-lg font-semibold text-green-300">
                    ${payment.amount}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-green-500/25">
                    <Receipt className="w-4 h-4 mr-1" />
                    Receipt
                  </Button>
                  <Button size="sm" variant="outline" className="border-green-500/25">
                    <Download className="w-4 h-4 mr-1" />
                    Invoice
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}