import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ApprovalBlockerProps {
  message?: string;
  className?: string;
}

export function ApprovalBlocker({ 
  message = "Your account is pending approval. Please complete your documents and wait for admin approval.",
  className = ""
}: ApprovalBlockerProps) {
  return (
    <Alert className={`border-red-200 bg-red-50 text-red-800 ${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="font-medium">
        {message}
      </AlertDescription>
    </Alert>
  );
}