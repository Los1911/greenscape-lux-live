import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface DisputeReviewModalProps {
  dispute: any;
  onClose: () => void;
  onUpdate: () => void;
}

export function DisputeReviewModal({ dispute, onClose, onUpdate }: DisputeReviewModalProps) {
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('payout_disputes')
        .update({
          status: newStatus,
          resolution_notes: notes,
          resolved_at: newStatus === 'resolved' || newStatus === 'rejected' ? new Date().toISOString() : null
        })
        .eq('id', dispute.id);

      if (error) throw error;

      // Send notification
      await supabase.functions.invoke('unified-email', {
        body: {
          type: 'payout_dispute_status_update',
          to: dispute.landscaper.email,
          data: {
            disputeId: dispute.id,
            status: newStatus,
            notes
          }
        }
      });

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating dispute:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Dispute</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Landscaper</Label>
            <p className="font-semibold">{dispute.landscaper?.business_name}</p>
            <p className="text-sm text-muted-foreground">{dispute.landscaper?.email}</p>
          </div>

          <div>
            <Label>Payout Amount</Label>
            <p className="font-semibold">${dispute.payout?.amount}</p>
            <p className="text-sm text-muted-foreground">
              Stripe ID: {dispute.payout?.stripe_payout_id}
            </p>
          </div>

          <div>
            <Label>Dispute Reason</Label>
            <Badge>{dispute.dispute_reason.replace(/_/g, ' ')}</Badge>
          </div>

          <div>
            <Label>Details</Label>
            <p className="text-sm">{dispute.dispute_details}</p>
          </div>

          {dispute.evidence_urls?.length > 0 && (
            <div>
              <Label>Evidence</Label>
              <div className="space-y-2">
                {dispute.evidence_urls.map((url: string, idx: number) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Evidence {idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Resolution Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about the resolution..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusUpdate('under_review')}
              disabled={processing}
              variant="outline"
            >
              Mark Under Review
            </Button>
            <Button
              onClick={() => handleStatusUpdate('resolved')}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              Resolve
            </Button>
            <Button
              onClick={() => handleStatusUpdate('rejected')}
              disabled={processing}
              variant="destructive"
            >
              Reject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}