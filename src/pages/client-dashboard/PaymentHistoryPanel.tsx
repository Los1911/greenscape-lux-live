import React, { useState } from 'react';
import { PaymentMethodManager } from '@/components/client/PaymentMethodManager';
import { PaymentSummaryCard } from '@/components/client/PaymentSummaryCard';
import { CreditCard, Receipt, Download, Filter } from 'lucide-react';

export const PaymentHistoryPanel: React.FC = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleAddPaymentMethod = () => {
    setShowPaymentModal(true);
  };

  const handleDownloadReceipt = (invoiceId: string) => {
    console.log('Download receipt for invoice:', invoiceId);
  };

  const handleViewInvoice = (invoiceId: string) => {
    console.log('View invoice:', invoiceId);
  };

  // Mock payment history data
  const paymentHistory = [
    {
      id: '1',
      date: '2024-01-15',
      amount: 250.00,
      service: 'Lawn Maintenance',
      status: 'completed',
      method: 'Visa ****4242'
    },
    {
      id: '2',
      date: '2024-01-08',
      amount: 180.00,
      service: 'Garden Cleanup',
      status: 'completed',
      method: 'Mastercard ****8888'
    },
    {
      id: '3',
      date: '2024-01-01',
      amount: 320.00,
      service: 'Tree Trimming',
      status: 'pending',
      method: 'Visa ****4242'
    }
  ];

  const filteredHistory = selectedFilter === 'all' 
    ? paymentHistory 
    : paymentHistory.filter(payment => payment.status === selectedFilter);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Payment History</h1>
          <p className="text-gray-400 mt-1">Manage payment methods and view transaction history</p>
        </div>
        <button 
          onClick={handleAddPaymentMethod}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 transition-all duration-200"
        >
          <CreditCard className="h-5 w-5" />
          Add Payment Method
        </button>

      </div>

      {/* Payment Summary */}
      <div className="w-full">
        <PaymentSummaryCard />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-gray-400">Filter by status:</span>
        </div>
        <div className="flex gap-2">
          {['all', 'completed', 'pending', 'failed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedFilter === filter
                  ? 'bg-emerald-500 text-black'
                  : 'bg-black/40 text-gray-300 hover:bg-black/60'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-emerald-500/25">
          <h3 className="text-xl font-semibold text-white">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/40">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Service</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Payment Method</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-500/10">
              {filteredHistory.map((payment) => (
                <tr key={payment.id} className="hover:bg-black/20 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{payment.service}</td>
                  <td className="px-6 py-4 text-sm text-white font-medium">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{payment.method}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'completed' 
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : payment.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewInvoice(payment.id)}
                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        title="View Invoice"
                      >
                        <Receipt className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDownloadReceipt(payment.id)}
                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        title="Download Receipt"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 border border-emerald-500/25 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl shadow-emerald-500/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Payment Methods</h3>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="h-10 w-10 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-all duration-200"
              >
                ✕
              </button>
            </div>
            <div className="text-white">
              <PaymentMethodManager 
                open={true}
                onOpenChange={setShowPaymentModal}
                onSuccess={() => {
                  console.log('Payment method added successfully');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryPanel;
