import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';

interface LandscaperApprovalToggleProps {
  landscaper: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    approved: boolean;
    insurance_file: string | null;
    license_file: string | null;
    documents_uploaded: boolean;
  };
  onApprovalChange: (landscaperId: string, approved: boolean) => void;
}

export function LandscaperApprovalToggle({ 
  landscaper, 
  onApprovalChange 
}: LandscaperApprovalToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const hasRequiredDocuments = landscaper.insurance_file && landscaper.license_file;
  const canApprove = hasRequiredDocuments && !landscaper.approved;

  const handleApprovalToggle = async () => {
    if (!hasRequiredDocuments) return;
    
    setIsLoading(true);
    try {
      const newApprovalStatus = !landscaper.approved;
      
      const { error } = await supabase
        .from('landscapers')
        .update({ 
          approved: newApprovalStatus,
          approval_date: newApprovalStatus ? new Date().toISOString() : null
        })
        .eq('id', landscaper.id);

      if (error) throw error;

      // Log the approval action
      await supabase
        .from('approval_logs')
        .insert({
          landscaper_id: landscaper.id,
          action: newApprovalStatus ? 'approved' : 'revoked',
          timestamp: new Date().toISOString()
        });

      onApprovalChange(landscaper.id, newApprovalStatus);
    } catch (error) {
      console.error('Error updating approval status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">
            {landscaper.first_name} {landscaper.last_name}
          </h3>
          <p className="text-sm text-gray-600">{landscaper.email}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {landscaper.approved ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            <span className={landscaper.insurance_file ? 'text-green-600' : 'text-red-600'}>
              Insurance: {landscaper.insurance_file ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            <span className={landscaper.license_file ? 'text-green-600' : 'text-red-600'}>
              License: {landscaper.license_file ? '✓' : '✗'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!hasRequiredDocuments && (
            <div className="flex items-center text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Missing docs
            </div>
          )}
          
          <Switch
            checked={landscaper.approved}
            onCheckedChange={handleApprovalToggle}
            disabled={!hasRequiredDocuments || isLoading}
          />
        </div>
      </div>
    </div>
  );
}