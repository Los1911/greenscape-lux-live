import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Filter, Search, Calendar, CreditCard, Receipt, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import PaymentSummaryStats from './PaymentSummaryStats';
import { InvoiceGenerator } from './InvoiceGenerator';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { toast } from '@/components/ui/use-toast';

interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'invoice';
  amount: number;
  currency: string;
  status: string;
  description: string;
  created: number;
  payment_method?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  fees: number;
  net_amount: number;
  receipt_url?: string;
}

export default function PaymentHistoryDashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isGeneratingBulkPDF, setIsGeneratingBulkPDF] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    transactionType: '',
    searchTerm: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (user) {
      fetchPaymentHistory();
    }
  }, [user, filters, currentPage]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-payment-history', {
        body: {
          userId: user?.id,
          startDate: filters.startDate,
          endDate: filters.endDate,
          transactionType: filters.transactionType,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage
        }
      });

      if (error) throw error;

      setTransactions(data.transactions || []);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, type: string) => {
    const statusColors = {
      succeeded: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      open: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Status', 'Payment Method', 'Fees', 'Net Amount'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        formatDate(t.created),
        t.type,
        `"${t.description}"`,
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
      
      pdfGenerator.generateBulkReport(filteredTransactions.map(t => ({
        ...t,
        net: t.net_amount,
        payment_method: t.payment_method ? {
          card: {
            brand: t.payment_method.brand,
            last4: t.payment_method.last4
          }
        } : undefined
      })), dateRange);
      
      const filename = `transaction-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdfGenerator.download(filename);
      
      toast({
        title: "Report Generated",
        description: "Your transaction report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating bulk PDF:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBulkPDF(false);
    }
  };

  const generateIndividualInvoice = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return transaction.description.toLowerCase().includes(searchLower) ||
             transaction.id.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment History</h1>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            onClick={generateBulkPDF} 
            disabled={isGeneratingBulkPDF || filteredTransactions.length === 0}
            className="flex items-center gap-2"
          >
            {isGeneratingBulkPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Export PDF Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <PaymentSummaryStats transactions={transactions} />
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Transaction Type</label>
              <Select value={filters.transactionType} onValueChange={(value) => setFilters(prev => ({ ...prev, transactionType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(transaction.created)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        {transaction.payment_method ? (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span className="capitalize">
                              {transaction.payment_method.brand} ****{transaction.payment_method.last4}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatAmount(transaction.amount, transaction.currency)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatAmount(transaction.fees, transaction.currency)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(transaction.net_amount, transaction.currency)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status, transaction.type)}
                      </TableCell>
                       <TableCell>
                         <div className="flex gap-1">
                           {transaction.receipt_url && (
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => window.open(transaction.receipt_url, '_blank')}
                               title="View Receipt"
                             >
                               <Receipt className="h-4 w-4" />
                             </Button>
                           )}
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => generateIndividualInvoice(transaction)}
                             title="Generate Invoice"
                           >
                             <FileText className="h-4 w-4" />
                           </Button>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No transactions found matching your criteria
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Individual Invoice Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Generate Invoice</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTransaction(null)}
              >
                ×
              </Button>
            </div>
            <InvoiceGenerator 
              transaction={{
                ...selectedTransaction,
                net: selectedTransaction.net_amount,
                payment_method: selectedTransaction.payment_method ? {
                  card: {
                    brand: selectedTransaction.payment_method.brand,
                    last4: selectedTransaction.payment_method.last4
                  }
                } : undefined
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
