import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, Download, Mail, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReceiptData {
  id: string;
  payment_intent_id: string;
  amount: number;
  platform_fee: number;
  landscaper_amount: number;
  customer_name: string;
  customer_email: string;
  job_description: string;
  service_date: string;
  payment_date: string;
  receipt_url?: string;
}

interface ReceiptGeneratorProps {
  paymentId: string;
  receiptData?: ReceiptData;
}

export default function ReceiptGenerator({ paymentId, receiptData }: ReceiptGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(receiptData || null);
  const { toast } = useToast();

  const generateReceipt = async () => {
    try {
      setGenerating(true);
      
      // Mock receipt generation - replace with actual API call
      const mockReceipt: ReceiptData = {
        id: `receipt_${Date.now()}`,
        payment_intent_id: paymentId,
        amount: 15000,
        platform_fee: 2250,
        landscaper_amount: 12750,
        customer_name: 'John Smith',
        customer_email: 'john@example.com',
        job_description: 'Lawn mowing and hedge trimming',
        service_date: new Date().toLocaleDateString(),
        payment_date: new Date().toLocaleDateString(),
        receipt_url: `https://pay.stripe.com/receipts/payment/${paymentId}`
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setReceipt(mockReceipt);
      
      toast({
        title: "Receipt Generated",
        description: "Payment receipt has been generated successfully",
      });
      
    } catch (error) {
      console.error('Receipt generation failed:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadReceipt = async () => {
    if (!receipt?.receipt_url) return;
    
    try {
      // Open receipt URL in new tab
      window.open(receipt.receipt_url, '_blank');
      
      toast({
        title: "Receipt Downloaded",
        description: "Receipt has been opened in a new tab",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download receipt",
        variant: "destructive"
      });
    }
  };

  const emailReceipt = async () => {
    if (!receipt) return;
    
    try {
      // Mock email sending - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Receipt Emailed",
        description: `Receipt sent to ${receipt.customer_email}`,
      });
    } catch (error) {
      console.error('Email failed:', error);
      toast({
        title: "Email Failed",
        description: "Failed to email receipt",
        variant: "destructive"
      });
    }
  };

  if (!receipt) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Receipt Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">No receipt generated for this payment yet.</p>
            <Button 
              onClick={generateReceipt} 
              disabled={generating}
              className="w-full"
            >
              {generating ? 'Generating...' : 'Generate Receipt'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Payment Receipt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Receipt Header */}
        <div className="text-center border-b pb-4">
          <h3 className="text-lg font-semibold">GreenScape Lux</h3>
          <p className="text-sm text-gray-600">Professional Landscaping Services</p>
          <Badge className="mt-2 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            PAID
          </Badge>
        </div>

        {/* Receipt Details */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Receipt ID:</span>
            <span className="font-mono text-sm">{receipt.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment ID:</span>
            <span className="font-mono text-sm">{receipt.payment_intent_id.slice(-8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Customer:</span>
            <span>{receipt.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service:</span>
            <span>{receipt.job_description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service Date:</span>
            <span>{receipt.service_date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Date:</span>
            <span>{receipt.payment_date}</span>
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Service Amount:</span>
            <span>${(receipt.amount / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Platform Fee:</span>
            <span>-${(receipt.platform_fee / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Landscaper Payout:</span>
            <span>${(receipt.landscaper_amount / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total Paid:</span>
            <span>${(receipt.amount / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={downloadReceipt}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button 
            onClick={emailReceipt}
            variant="outline"
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}