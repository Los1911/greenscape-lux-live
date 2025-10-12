import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApprovalStatusBannerProps {
  approved: boolean;
  hasInsuranceFile: boolean;
  hasLicenseFile: boolean;
  onUploadDocuments: () => void;
}

export function ApprovalStatusBanner({ 
  approved, 
  hasInsuranceFile, 
  hasLicenseFile, 
  onUploadDocuments 
}: ApprovalStatusBannerProps) {
  if (approved) {
    return (
      <div className="w-full px-4 sm:px-6">
        <Alert className="border-green-500/50 bg-green-500/10 text-green-200 backdrop-blur">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="font-medium text-green-200">
            Your account is approved! You can now accept jobs and receive payouts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasAllDocuments = hasInsuranceFile && hasLicenseFile;

  return (
    <div className="w-full px-4 sm:px-6">
      <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-200 backdrop-blur">
        <Clock className="h-4 w-4 text-amber-400" />
        <AlertDescription>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-amber-200">
                {hasAllDocuments 
                  ? "Pending Approval: Documents uploaded, awaiting admin review."
                  : "Pending Approval: Upload required documents to get started."
                }
              </p>
              {!hasAllDocuments && (
                <p className="text-sm mt-1 text-amber-300/80">
                  Missing: {!hasInsuranceFile && "Insurance"} {!hasInsuranceFile && !hasLicenseFile && " & "} {!hasLicenseFile && "License"}
                </p>
              )}
            </div>
            {!hasAllDocuments && (
              <Button 
                onClick={onUploadDocuments}
                size="sm"
                className="bg-amber-600/80 hover:bg-amber-600 text-white shadow-lg hover:shadow-amber-600/25 transition-all duration-200 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
