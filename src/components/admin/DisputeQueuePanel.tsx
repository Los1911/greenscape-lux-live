import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DisputeReviewModal } from './DisputeReviewModal';

interface Dispute {
  id: string;
  payout_id: string;
  landscaper_id: string;
  dispute_reason: string;
  dispute_details: string;
  evidence_urls: string[];
  status: string;
  created_at: string;
  landscaper?: { business_name: string; email: string };
  payout?: { amount: number; stripe_payout_id: string };
}

export function DisputeQueuePanel() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadDisputes();
  }, [filter]);

  const loadDisputes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payout_disputes')
      .select(`
        *,
        landscaper:landscapers(business_name, email),
        payout:payouts(amount, stripe_payout_id)
      `)
      .eq('status', filter)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDisputes(data);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      under_review: 'bg-blue-500',
      resolved: 'bg-green-500',
      rejected: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payout Dispute Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="under_review">Under Review</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-4 mt-4">
              {loading ? (
                <p>Loading disputes...</p>
              ) : disputes.length === 0 ? (
                <p className="text-muted-foreground">No {filter} disputes</p>
              ) : (
                disputes.map((dispute) => (
                  <Card key={dispute.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(dispute.status)}>
                              {dispute.status}
                            </Badge>
                            <span className="font-semibold">
                              {dispute.landscaper?.business_name}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Reason: {dispute.dispute_reason.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm">Amount: ${dispute.payout?.amount}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(dispute.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button onClick={() => setSelectedDispute(dispute)}>
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedDispute && (
        <DisputeReviewModal
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onUpdate={loadDisputes}
        />
      )}
    </div>
  );
}