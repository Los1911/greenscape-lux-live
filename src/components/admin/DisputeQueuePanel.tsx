import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DisputeReviewModal } from './DisputeReviewModal';
import { RefreshCw, AlertTriangle } from 'lucide-react';

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
  const { user, loading: authLoading } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    
    loadDisputes();
  }, [authLoading, user, filter]);

  const loadDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('payout_disputes')
        .select(`
          *,
          landscaper:landscapers(business_name, email),
          payout:payouts(amount, stripe_payout_id)
        `)
        .eq('status', filter)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDisputes(data || []);
    } catch (err) {
      console.error('Error loading disputes:', err);
      setError('Failed to load disputes');
    } finally {
      setLoading(false);
    }
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <Button onClick={loadDisputes}>Retry</Button>
      </div>
    );
  }

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