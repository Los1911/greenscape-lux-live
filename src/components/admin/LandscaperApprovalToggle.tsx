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
    <div className="border rounded-lg p-4 overflow-hidden">
      {/* ── Card body ──────────────────────────────────────
           Mobile (<lg): flex-col stacked
           Desktop (lg+): flex-row, items-center, justify-between */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        {/* ── Left: Name + email ─────────────────────────── */}
        <div className="min-w-0">
          <h3 className="font-medium truncate">
            {landscaper.first_name} {landscaper.last_name}
          </h3>
          <p className="text-sm text-gray-600 truncate">{landscaper.email}</p>
        </div>

        {/* ── Right: Status badge ────────────────────────── */}
        <div className="flex items-center shrink-0">
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

      {/* ── Documents + Toggle row ─────────────────────────
           Mobile (<lg): stacked vertically
           Desktop (lg+): flex-row, items-center, justify-between */}
      <div className="flex flex-col gap-3 mt-3 lg:flex-row lg:items-center lg:justify-between">

        {/* ── Document status badges ─────────────────────── */}
        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-4">
          <div className="flex items-center h-10">
            <FileText className="h-4 w-4 mr-1 shrink-0" />
            <span className={landscaper.insurance_file ? 'text-green-600' : 'text-red-600'}>
              Insurance: {landscaper.insurance_file ? 'Verified' : 'Missing'}
            </span>
          </div>
          <div className="flex items-center h-10">
            <FileText className="h-4 w-4 mr-1 shrink-0" />
            <span className={landscaper.license_file ? 'text-green-600' : 'text-red-600'}>
              License: {landscaper.license_file ? 'Verified' : 'Missing'}
            </span>
          </div>
        </div>

        {/* ── Toggle + warning ───────────────────────────── */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2 lg:shrink-0">
          {!hasRequiredDocuments && (
            <div className="flex items-center text-amber-600 text-sm h-10">
              <AlertCircle className="h-4 w-4 mr-1 shrink-0" />
              Missing docs
            </div>
          )}
          
          <div className="flex items-center h-10">
            <Switch
              checked={landscaper.approved}
              onCheckedChange={handleApprovalToggle}
              disabled={!hasRequiredDocuments || isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
