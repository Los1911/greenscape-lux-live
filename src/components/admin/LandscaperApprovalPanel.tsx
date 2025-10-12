import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandscaperApprovalToggle } from '@/components/admin/LandscaperApprovalToggle';
import { AlertTriangle, CheckCircle, XCircle, FileText, Shield } from 'lucide-react';

interface Landscaper {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  business_name: string;
  approved: boolean;
  documents_uploaded: boolean;
  insurance_file: string;
  license_file: string;
  approval_date: string;
}

export default function LandscaperApprovalPanel() {
  const [landscapers, setLandscapers] = useState<Landscaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLandscapers();
  }, []);

  const fetchLandscapers = async () => {
    try {
      const { data, error } = await supabase
        .from('landscapers')
        .select('id, name, email, phone, approved, created_at, business_name, experience_years')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLandscapers(data || []);
    } catch (error) {
      console.error('Error fetching landscapers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (landscaperId: string, currentStatus: boolean) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const newStatus = !currentStatus;
      const action = newStatus ? 'approved' : 'denied';

      // Update landscaper approval status
      const { error: updateError } = await supabase
        .from('landscapers')
        .update({
          approved: newStatus,
          approval_date: newStatus ? new Date().toISOString() : null,
          approved_by: newStatus ? user.user.id : null
        })
        .eq('id', landscaperId);

      if (updateError) throw updateError;

      // Log approval action
      const { error: logError } = await supabase
        .from('approval_logs')
        .insert({
          landscaper_id: landscaperId,
          admin_id: user.user.id,
          action,
          reason: `Admin ${action} landscaper via dashboard`
        });

      if (logError) console.error('Logging error:', logError);

      // Refresh data
      fetchLandscapers();
    } catch (error) {
      console.error('Error updating approval:', error);
    }
  };
  const handleApprovalChange = (landscaperId: string, approved: boolean) => {
    setLandscapers(prev => 
      prev.map(l => 
        l.id === landscaperId 
          ? { ...l, approved, approval_date: approved ? new Date().toISOString() : null }
          : l
      )
    );
  };

  if (loading) {
    return <div className="p-4 text-white">Loading landscapers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-green-400" />
        <h2 className="text-2xl font-bold text-white">Landscaper Approval System</h2>
      </div>

      <div className="grid gap-4">
        {landscapers.map((landscaper) => (
          <LandscaperApprovalToggle
            key={landscaper.id}
            landscaper={{
              id: landscaper.id,
              first_name: landscaper.first_name,
              last_name: landscaper.last_name,
              email: landscaper.email,
              approved: landscaper.approved,
              insurance_file: landscaper.insurance_file,
              license_file: landscaper.license_file,
              documents_uploaded: landscaper.documents_uploaded
            }}
            onApprovalChange={handleApprovalChange}
          />
        ))}
        
        {landscapers.length === 0 && (
          <Card className="bg-black/40 border-green-500/25 p-6">
            <div className="text-center text-gray-400">
              No landscapers found. New signups will appear here for approval.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}