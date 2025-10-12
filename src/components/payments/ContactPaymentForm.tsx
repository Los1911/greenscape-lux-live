import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Phone, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContactPaymentFormProps {
  amount: number;
  jobId?: string;
  onSuccess?: () => void;
}

export default function ContactPaymentForm({ amount, jobId, onSuccess }: ContactPaymentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit contact form for manual payment processing
      const response = await fetch('/api/contact-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount,
          jobId,
          type: 'payment_request'
        })
      });

      if (response.ok) {
        toast({
          title: "Payment Request Sent",
          description: "We'll contact you shortly to process your payment."
        });
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send payment request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Request - ${amount}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <Mail className="w-4 h-4" />
          <AlertDescription>
            We'll contact you to securely process your payment of ${amount}.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Any additional details about your payment..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Request Payment Processing'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            Or call us at: (555) 123-4567
          </p>
        </div>
      </CardContent>
    </Card>
  );
}