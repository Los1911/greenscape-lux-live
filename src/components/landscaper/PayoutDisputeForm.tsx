import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PayoutDisputeFormProps {
  payoutId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PayoutDisputeForm({ payoutId, onSuccess, onCancel }: PayoutDisputeFormProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    try {
      // Upload evidence files
      const evidenceUrls: string[] = [];
      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('landscaper-documents')
          .upload(`dispute-evidence/${fileName}`, file);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('landscaper-documents')
          .getPublicUrl(data.path);
        
        evidenceUrls.push(publicUrl);
      }

      // Submit dispute
      const { data, error: fnError } = await supabase.functions.invoke('submit-payout-dispute', {
        body: {
          payoutId,
          disputeReason: reason,
          disputeDetails: details,
          evidenceUrls
        }
      });

      if (fnError) throw fnError;

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Dispute Reason</Label>
        <Select value={reason} onValueChange={setReason} required>
          <SelectTrigger>
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="incorrect_amount">Incorrect Amount</SelectItem>
            <SelectItem value="payout_failed">Payout Failed</SelectItem>
            <SelectItem value="missing_payout">Missing Payout</SelectItem>
            <SelectItem value="account_issue">Account Issue</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Details</Label>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Provide detailed information about the dispute..."
          rows={4}
          required
        />
      </div>

      <div>
        <Label>Evidence (Optional)</Label>
        <div className="border-2 border-dashed rounded-lg p-4">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="evidence-upload"
            accept="image/*,.pdf"
          />
          <label htmlFor="evidence-upload" className="cursor-pointer flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <span>{files.length > 0 ? `${files.length} file(s) selected` : 'Upload evidence'}</span>
          </label>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={uploading}>
          {uploading ? 'Submitting...' : 'Submit Dispute'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}