import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Loader2 } from 'lucide-react';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { toast } from '@/components/ui/use-toast';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description?: string;
  payment_method?: {
    card?: {
      brand: string;
      last4: string;
    };
  };
  fees?: number;
  net?: number;
}

interface InvoiceGeneratorProps {
  transaction: Transaction;
  className?: string;
}

export function InvoiceGenerator({ transaction, className }: InvoiceGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      
      const pdfGenerator = new PDFGenerator();
      pdfGenerator.generateInvoice(transaction);
      
      const filename = `invoice-${transaction.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdfGenerator.download(filename);
      
      toast({
        title: "Invoice Generated",
        description: "Your invoice has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: transaction.currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Transaction Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Transaction ID</p>
            <p className="font-mono text-xs">{transaction.id}</p>
          </div>
          <div>
            <p className="text-gray-600">Date</p>
            <p>{new Date(transaction.created * 1000).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Amount</p>
            <p className="font-semibold">{formatAmount(transaction.amount)}</p>
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <Badge className={getStatusColor(transaction.status)}>
              {transaction.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {transaction.payment_method?.card && (
          <div className="pt-2 border-t">
            <p className="text-gray-600 text-sm">Payment Method</p>
            <p className="font-medium">
              {transaction.payment_method.card.brand.toUpperCase()} ****{transaction.payment_method.card.last4}
            </p>
          </div>
        )}

        {(transaction.fees || transaction.net) && (
          <div className="pt-2 border-t space-y-2 text-sm">
            {transaction.fees && (
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee</span>
                <span>{formatAmount(transaction.fees)}</span>
              </div>
            )}
            {transaction.net && (
              <div className="flex justify-between font-semibold">
                <span>Net Amount</span>
                <span>{formatAmount(transaction.net)}</span>
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={generatePDF} 
          disabled={isGenerating}
          className="w-full mt-4"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}