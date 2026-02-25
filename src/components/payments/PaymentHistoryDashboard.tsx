import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  CreditCard, 
  Receipt, 
  FileText, 
  RefreshCw, 
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  DollarSign,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PDFGenerator } from '@/utils/pdfGenerator';

interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'invoice';
  amount: number;
  currency: string;
  status: string;
  description: string;
  created: number;
  payment_method?: { brand: string; last4: string; exp_month: number; exp_year: number; };
  fees: number;
  net_amount: number;
  receipt_url?: string;
}

// Status configuration
const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  succeeded: {
    label: 'Completed',
    icon: CheckCircle,
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  paid: {
    label: 'Paid',
    icon: CheckCircle,
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    bgColor: 'bg-amber-500/15',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  open: {
    label: 'Open',
    icon: Clock,
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
  },
  refunded: {
    label: 'Refunded',
    icon: RefreshCw,
    bgColor: 'bg-gray-500/15',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500/30',
  },
};

const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;
};

// Summary Stats Component
const SummaryStats: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const totalAmount = transactions
    .filter(t => t.status === 'succeeded' || t.status === 'paid')
    .reduce((sum, t) => sum + (t.amount || 0), 0) / 100;
  
  const pendingAmount = transactions
    .filter(t => t.status === 'pending' || t.status === 'open')
    .reduce((sum, t) => sum + (t.amount || 0), 0) / 100;
  
  const transactionCount = transactions.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-black/40 border border-emerald-500/15 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-sm text-gray-400">Total Completed</span>
        </div>
        <p className="text-2xl font-bold text-white">
          ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
      
      <div className="bg-black/40 border border-emerald-500/15 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-sm text-gray-400">Pending</span>
        </div>
        <p className="text-2xl font-bold text-white">
          ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
      
      <div className="bg-black/40 border border-emerald-500/15 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Receipt className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-sm text-gray-400">Transactions</span>
        </div>
        <p className="text-2xl font-bold text-white">{transactionCount}</p>
      </div>
    </div>
  );
};

// Transaction Card Component
const TransactionCard: React.FC<{
  transaction: Transaction;
  onViewReceipt: (url: string) => void;
  onGenerateInvoice: (transaction: Transaction) => void;
}> = ({ transaction, onViewReceipt, onGenerateInvoice }) => {
  const status = getStatusConfig(transaction.status);
  const StatusIcon = status.icon;
  const amount = (transaction.amount || 0) / 100;
  const isNegative = transaction.type === 'refund' || amount < 0;

  const formatDate = (timestamp: number) => {
    return new Date((timestamp || 0) * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-black/40 border border-emerald-500/15 rounded-xl p-4 hover:border-emerald-500/30 transition-all duration-200">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
              {transaction.type}
            </span>
          </div>
          <h4 className="font-medium text-white truncate">
            {transaction.description || 'Transaction'}
          </h4>
          <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{formatDate(transaction.created)}</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${status.bgColor} ${status.textColor} border ${status.borderColor} flex-shrink-0`}>
          <StatusIcon className="h-3 w-3" />
          <span className="text-xs font-medium">{status.label}</span>
        </div>
      </div>

      {/* Amount & Payment Method */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className={`text-xl font-bold ${isNegative ? 'text-red-400' : 'text-white'}`}>
          {isNegative ? '-' : ''}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        {transaction.payment_method && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CreditCard className="h-4 w-4" />
            <span className="capitalize">{transaction.payment_method.brand} ****{transaction.payment_method.last4}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {transaction.receipt_url && (
          <button
            onClick={() => onViewReceipt(transaction.receipt_url!)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors text-sm font-medium"
          >
            <Receipt className="h-4 w-4" />
            <span>Receipt</span>
          </button>
        )}
        <button
          onClick={() => onGenerateInvoice(transaction)}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-black/40 text-gray-300 hover:text-white hover:bg-black/60 border border-emerald-500/10 transition-colors text-sm font-medium"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Invoice</span>
        </button>
      </div>
    </div>
  );
};

// Filter Section Component
const FilterSection: React.FC<{
  filters: { startDate: string; endDate: string; transactionType: string; searchTerm: string };
  setFilters: React.Dispatch<React.SetStateAction<{ startDate: string; endDate: string; transactionType: string; searchTerm: string }>>;
  onExportCSV: () => void;
  onExportPDF: () => void;
  isExporting: boolean;
  hasTransactions: boolean;
}> = ({ filters, setFilters, onExportCSV, onExportPDF, isExporting, hasTransactions }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'payment', label: 'Payments' },
    { value: 'refund', label: 'Refunds' },
    { value: 'invoice', label: 'Invoices' },
  ];

  const selectedType = typeOptions.find(o => o.value === filters.transactionType) || typeOptions[0];

  return (
    <div className="space-y-4">
      {/* Search & Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-emerald-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
            showFilters 
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
              : 'bg-black/40 border-emerald-500/20 text-gray-300 hover:border-emerald-500/40'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span className="sm:inline hidden">Filters</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-black/40 border border-emerald-500/15 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-emerald-500/20 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            
            {/* End Date */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-emerald-500/20 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            
            {/* Type Dropdown */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Type</label>
              <div className="relative">
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-black/60 border border-emerald-500/20 text-white hover:border-emerald-500/40 transition-colors"
                >
                  <span>{selectedType.label}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showTypeDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowTypeDropdown(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border border-emerald-500/20 rounded-lg shadow-xl z-50 overflow-hidden">
                      {typeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilters(prev => ({ ...prev, transactionType: option.value }));
                            setShowTypeDropdown(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            filters.transactionType === option.value
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-gray-300 hover:bg-emerald-500/10'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-emerald-500/10">
            <button
              onClick={onExportCSV}
              disabled={!hasTransactions}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={onExportPDF}
              disabled={!hasTransactions || isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ hasFilters: boolean }> = ({ hasFilters }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
        <Receipt className="h-10 w-10 text-emerald-500/50" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {hasFilters ? 'No Matching Transactions' : 'No Transactions Yet'}
      </h3>
      <p className="text-gray-400 text-center max-w-sm">
        {hasFilters 
          ? 'Try adjusting your filters to see more results.'
          : 'Your transaction history will appear here once you complete your first payment.'
        }
      </p>
      {!hasFilters && (
        <div className="flex items-center gap-2 text-sm text-emerald-400/70 mt-4">
          <TrendingUp className="h-4 w-4" />
          <span>Transactions will show up automatically</span>
        </div>
      )}
    </div>
  );
};

// Main Component
export default function PaymentHistoryDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isGeneratingBulkPDF, setIsGeneratingBulkPDF] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', transactionType: '', searchTerm: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (!authLoading && user) fetchPaymentHistory();
    else if (!authLoading && !user) setLoading(false);
  }, [user, authLoading, filters, currentPage]);

  const fetchPaymentHistory = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-payment-history', {
        body: { 
          userId: user.id, 
          startDate: filters.startDate, 
          endDate: filters.endDate, 
          transactionType: filters.transactionType, 
          limit: itemsPerPage, 
          offset: (currentPage - 1) * itemsPerPage 
        }
      });
      if (error) throw error;
      setTransactions(data?.transactions || []);
      setTotalPages(Math.ceil((data?.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency?.toUpperCase() || 'USD' 
    }).format((amount || 0) / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date((timestamp || 0) * 1000).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Status', 'Payment Method', 'Fees', 'Net Amount'];
    const csvContent = [
      headers.join(','), 
      ...filteredTransactions.map(t => [
        formatDate(t.created), 
        t.type, 
        `"${t.description || ''}"`, 
        formatAmount(t.amount, t.currency), 
        t.status, 
        t.payment_method ? `${t.payment_method.brand} ****${t.payment_method.last4}` : 'N/A', 
        formatAmount(t.fees, t.currency), 
        formatAmount(t.net_amount, t.currency)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`; 
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateBulkPDF = async () => {
    try {
      setIsGeneratingBulkPDF(true);
      const pdfGenerator = new PDFGenerator();
      const dateRange = filters.startDate && filters.endDate 
        ? `${filters.startDate} to ${filters.endDate}` 
        : 'All Time';
      pdfGenerator.generateBulkReport(
        filteredTransactions.map(t => ({ 
          ...t, 
          net: t.net_amount, 
          payment_method: t.payment_method 
            ? { card: { brand: t.payment_method.brand, last4: t.payment_method.last4 } } 
            : undefined 
        })), 
        dateRange
      );
      pdfGenerator.download(`transaction-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingBulkPDF(false);
    }
  };

  const handleViewReceipt = (url: string) => {
    window.open(url, '_blank');
  };

  const handleGenerateInvoice = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const filteredTransactions = (transactions || []).filter(t => {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (t.description || '').toLowerCase().includes(searchLower) || 
             (t.id || '').toLowerCase().includes(searchLower);
    }
    return true;
  });

  const hasFilters = !!(filters.searchTerm || filters.startDate || filters.endDate || filters.transactionType);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-emerald-950/10 to-black flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-emerald-950/10 to-black flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-amber-400" />
          </div>
          <p className="text-gray-400">Please sign in to view payment history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-emerald-950/10 to-black">
      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Payment History</h1>
          <p className="text-gray-400 text-sm">View and manage your transaction history</p>
        </div>

        {/* Summary Stats */}
        <SummaryStats transactions={transactions} />

        {/* Filters */}
        <FilterSection
          filters={filters}
          setFilters={setFilters}
          onExportCSV={exportToCSV}
          onExportPDF={generateBulkPDF}
          isExporting={isGeneratingBulkPDF}
          hasTransactions={filteredTransactions.length > 0}
        />

        {/* Transaction List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Transactions {filteredTransactions.length > 0 && `(${filteredTransactions.length})`}
            </h2>
          </div>

          {loading ? (
            // Loading State
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-black/40 border border-emerald-500/15 rounded-xl p-4 animate-pulse">
                  <div className="flex justify-between mb-3">
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-emerald-500/20 rounded" />
                      <div className="h-5 w-40 bg-emerald-500/15 rounded" />
                      <div className="h-3 w-24 bg-emerald-500/10 rounded" />
                    </div>
                    <div className="h-6 w-20 bg-emerald-500/15 rounded-full" />
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-7 w-28 bg-emerald-500/20 rounded" />
                    <div className="h-4 w-32 bg-emerald-500/10 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-emerald-500/10 rounded-lg" />
                    <div className="h-10 w-24 bg-emerald-500/10 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onViewReceipt={handleViewReceipt}
                  onGenerateInvoice={handleGenerateInvoice}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center h-10 w-10 rounded-lg bg-black/40 border border-emerald-500/20 text-gray-400 hover:text-white hover:border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-4 text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center h-10 w-10 rounded-lg bg-black/40 border border-emerald-500/20 text-gray-400 hover:text-white hover:border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedTransaction(null)}
          />
          <div className="relative w-full max-w-md bg-black/95 border border-emerald-500/20 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden">
            {/* Handle bar for mobile */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-emerald-500/20">
              <h3 className="text-lg font-semibold text-white">Generate Invoice</h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="h-8 w-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="bg-black/40 border border-emerald-500/15 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Transaction</p>
                <p className="font-medium text-white">{selectedTransaction.description || 'Payment'}</p>
              </div>
              <div className="bg-black/40 border border-emerald-500/15 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Amount</p>
                <p className="text-2xl font-bold text-white">
                  {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                </p>
              </div>
              <button
                onClick={() => {
                  // Generate invoice logic here
                  setSelectedTransaction(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold transition-all duration-200"
              >
                <FileText className="h-5 w-5" />
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
