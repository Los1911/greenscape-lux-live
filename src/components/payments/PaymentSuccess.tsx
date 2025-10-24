import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ArrowLeft } from 'lucide-react';
import { formatAmount } from '@/lib/stripe';

interface PaymentSuccessProps {
  paymentIntent?: {
    id: string;
    amount: number;
    status: string;
    created: number;
  };
  onContinue?: () => void;
  onDownloadReceipt?: () => void;
  showDownloadReceipt?: boolean;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  paymentIntent,
  onContinue,
  onDownloadReceipt,
  showDownloadReceipt = false,
}) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <CardTitle className="text-green-600">Payment Successful!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentIntent && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="font-medium">{formatAmount(paymentIntent.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment ID:</span>
              <span className="font-mono text-sm">{paymentIntent.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className="capitalize font-medium text-green-600">
                {paymentIntent.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date:</span>
              <span className="text-sm">
                {new Date(paymentIntent.created * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {showDownloadReceipt && onDownloadReceipt && (
            <Button
              variant="outline"
              onClick={onDownloadReceipt}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
          )}
          
          {onContinue && (
            <Button onClick={onContinue} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          A confirmation email has been sent to your registered email address.
        </p>
      </CardContent>
    </Card>
  );
};