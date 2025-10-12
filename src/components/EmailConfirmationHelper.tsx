import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

interface EmailConfirmationHelperProps {
  email: string;
  onConfirmed?: () => void;
}

export function EmailConfirmationHelper({ email, onConfirmed }: EmailConfirmationHelperProps) {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleResendConfirmation = async () => {
    setIsResending(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        throw error;
      }

      setMessage('Confirmation email sent! Please check your inbox and spam folder.');
      setIsError(false);
    } catch (error: any) {
      console.error('Resend error:', error);
      setMessage('Failed to resend confirmation email. Please contact support.');
      setIsError(true);
    } finally {
      setIsResending(false);
    }
  };

  const handleManualConfirm = async () => {
    try {
      // For development/testing - manually confirm the account
      const { error } = await supabase.functions.invoke('fix-signup-email-delivery', {
        body: { 
          action: 'manual_confirm',
          email: email 
        }
      });

      if (!error) {
        setMessage('Account confirmed successfully!');
        setIsError(false);
        onConfirmed?.();
      }
    } catch (error) {
      console.error('Manual confirm error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-900 border-emerald-500/20">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-emerald-500/10 rounded-full w-fit">
          <Mail className="h-6 w-6 text-emerald-400" />
        </div>
        <CardTitle className="text-white">Check Your Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-300 text-sm text-center">
          We sent a confirmation email to:
          <br />
          <span className="font-semibold text-emerald-400">{email}</span>
        </p>
        
        <p className="text-gray-400 text-xs text-center">
          Click the link in the email to activate your account. 
          Don't forget to check your spam folder!
        </p>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            isError 
              ? 'bg-red-500/10 border border-red-500/20' 
              : 'bg-emerald-500/10 border border-emerald-500/20'
          }`}>
            {isError ? (
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className={`text-sm ${isError ? 'text-red-300' : 'text-emerald-300'}`}>
              {message}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleResendConfirmation}
            disabled={isResending}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isResending ? 'Sending...' : 'Resend Confirmation Email'}
          </Button>
          
          {import.meta.env?.DEV && (
            <Button
              onClick={handleManualConfirm}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Skip Email Verification (Dev Only)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}