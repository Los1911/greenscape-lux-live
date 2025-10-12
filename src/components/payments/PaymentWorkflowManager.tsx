import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle, Receipt, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentWorkflowManagerProps {
  jobId?: string;
  customerId?: string;
}

interface PaymentStatus {
  id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  amount: number;
  created: Date;
  receipt_url?: string;
  job_id?: string;
}

export default function PaymentWorkflowManager({ jobId, customerId }: PaymentWorkflowManagerProps) {
  const [payments, setPayments] = useState<PaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
  }, [jobId, customerId]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // Mock payment data - replace with actual API call
      const mockPayments: PaymentStatus[] = [
        {
          id: 'pi_1234567890',
          status: 'succeeded',
          amount: 15000,
          created: new Date(Date.now() - 86400000),
          receipt_url: 'https://pay.stripe.com/receipts/payment/12345',
          job_id: jobId
        },
        {
          id: 'pi_0987654321',
          status: 'processing',
          amount: 8500,
          created: new Date(Date.now() - 3600000),
          job_id: jobId
        }
      ];
      setPayments(mockPayments);
    } catch (error) {
      console.error('Failed to load payments:', error);
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (paymentId: string) => {
    try {
      // Simulate payment processing
      setPayments(prev => prev.map(p => 
        p.id === paymentId 
          ? { ...p, status: 'processing' as const }
          : p
      ));

      // Mock API call to process payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      setPayments(prev => prev.map(p => 
        p.id === paymentId 
          ? { 
              ...p, 
              status: 'succeeded' as const,
              receipt_url: `https://pay.stripe.com/receipts/payment/${paymentId}`
            }
          : p
      ));

      // Trigger fulfillment workflow
      await triggerOrderFulfillment(paymentId);
      
      toast({
        title: "Payment Processed",
        description: "Payment completed successfully and order fulfillment initiated",
      });
    } catch (error) {
      console.error('Payment processing failed:', error);
      setPayments(prev => prev.map(p => 
        p.id === paymentId 
          ? { ...p, status: 'failed' as const }
          : p
      ));
      
      toast({
        title: "Payment Failed",
        description: "Payment processing failed. Please try again.",
        variant: "destructive"
      });
    }
  };

  const triggerOrderFulfillment = async (paymentId: string) => {
    // Mock order fulfillment logic
    console.log('Triggering order fulfillment for payment:', paymentId);
    
    // Send notifications
    await sendCustomerNotification(paymentId);
    await sendLandscaperNotification(paymentId);
    
    // Update job status
    await updateJobStatus(paymentId);
  };

  const sendCustomerNotification = async (paymentId: string) => {
    console.log('Sending customer notification for payment:', paymentId);
    // Mock notification sending
  };

  const sendLandscaperNotification = async (paymentId: string) => {
    console.log('Sending landscaper notification for payment:', paymentId);
    // Mock notification sending
  };

  const updateJobStatus = async (paymentId: string) => {
    console.log('Updating job status for payment:', paymentId);
    // Mock job status update
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Workflow Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No payments found for this customer or job.
                </AlertDescription>
              </Alert>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium">Payment {payment.id.slice(-8)}</p>
                        <p className="text-sm text-gray-500">
                          ${(payment.amount / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Created: {payment.created.toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      {payment.receipt_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(payment.receipt_url, '_blank')}
                        >
                          View Receipt
                        </Button>
                      )}
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => processPayment(payment.id)}
                        >
                          Process Payment
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}