import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { handleUnifiedPasswordReset, getPasswordResetUrl } from '@/utils/unifiedPasswordResetHandler';

interface ForgotPasswordInlineProps {
  onClose?: () => void;
}

export const ForgotPasswordInline: React.FC<ForgotPasswordInlineProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Use unified password reset handler that routes through our Resend pipeline
      const result = await handleUnifiedPasswordReset(email, getPasswordResetUrl());
      
      if (!result.success) {
        if (result.isRateLimited) {
          setError('Too many requests. Please wait before trying again.');
        } else {
          setError(result.error || 'Failed to send reset email');
        }
        return;
      }
      
      setMessage('Password reset email sent! Please check your inbox.');

      setTimeout(() => {
        onClose?.();
      }, 3000);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-3">Reset Password</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Sending...' : 'Send Reset Email'}
          </Button>
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  );
};
