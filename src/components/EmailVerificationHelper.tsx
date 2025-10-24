import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { runSignupEmailDiagnostic, forceEmailConfirmation, SignupEmailDiagnostic } from '@/utils/signupEmailDiagnostic';

interface EmailVerificationHelperProps {
  email: string;
  onSuccess?: () => void;
}

export default function EmailVerificationHelper({ email, onSuccess }: EmailVerificationHelperProps) {
  const [loading, setLoading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<SignupEmailDiagnostic | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDiagnostic = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await runSignupEmailDiagnostic(email);
      setDiagnostic(result);
      
      if (result.fixes.resendAttempt?.success) {
        setMessage({ type: 'success', text: 'Verification email sent successfully!' });
      } else if (result.fixes.resendAttempt?.error) {
        setMessage({ type: 'error', text: result.fixes.resendAttempt.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForceConfirm = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await forceEmailConfirmation(email);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Email confirmed successfully!' });
        onSuccess?.();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to confirm email' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-black/60 border-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-emerald-400 flex items-center">
          <Mail className="w-5 h-5 mr-2" />
          Email Verification Helper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert className={`border-${message.type === 'success' ? 'emerald' : 'red'}-500/50 bg-${message.type === 'success' ? 'emerald' : 'red'}-900/30`}>
            <AlertDescription className={`text-${message.type === 'success' ? 'emerald' : 'red'}-300`}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleDiagnostic}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Resend Verification Email
          </Button>

          <Button
            onClick={handleForceConfirm}
            disabled={loading}
            variant="outline"
            className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Force Email Confirmation (Dev)
          </Button>
        </div>

        {diagnostic && (
          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-xs">
            <h4 className="text-emerald-400 font-semibold mb-2">Diagnostic Results:</h4>
            
            {diagnostic.checks.userExists && (
              <div className="mb-2">
                <span className="text-gray-400">User Status: </span>
                <span className={diagnostic.checks.userExists.found ? 'text-green-400' : 'text-red-400'}>
                  {diagnostic.checks.userExists.found ? 'Found' : 'Not Found'}
                </span>
                {diagnostic.checks.userExists.emailConfirmed !== undefined && (
                  <span className={`ml-2 ${diagnostic.checks.userExists.emailConfirmed ? 'text-green-400' : 'text-yellow-400'}`}>
                    ({diagnostic.checks.userExists.emailConfirmed ? 'Confirmed' : 'Unconfirmed'})
                  </span>
                )}
              </div>
            )}

            {diagnostic.recommendations.length > 0 && (
              <div>
                <span className="text-gray-400">Recommendations:</span>
                <ul className="mt-1 ml-4 list-disc text-gray-300">
                  {diagnostic.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}