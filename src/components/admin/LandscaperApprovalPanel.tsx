import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandscaperApprovalToggle } from '@/components/admin/LandscaperApprovalToggle';
import { AlertTriangle, CheckCircle, XCircle, FileText, Shield, RefreshCw, MapPin, Ban, Target } from 'lucide-react';

interface WorkArea {
  id: string;
  zip_code: string;
  radius_miles: number;
  is_temporary: boolean;
  auto_added: boolean;
}

interface ExcludedArea {
  id: string;
  zip_code: string;
  reason: string | null;
}

interface Landscaper {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  business_name: string;
  approved: boolean;
  documents_uploaded: boolean;
  insurance_file: string;
  license_file: string;
  approval_date: string;
  created_at: string;
  work_areas?: WorkArea[];
  excluded_areas?: ExcludedArea[];
}

export function LandscaperApprovalPanel() {
  const { user, loading: authLoading } = useAuth();
  const [landscapers, setLandscapers] = useState<Landscaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to resolve before fetching data
    if (authLoading) return;
    if (!user) return;
    
    fetchLandscapers();
  }, [authLoading, user]);

  const fetchLandscapers = async () => {
    try {
      setError(null);
      
      // First, get landscaper records with their actual columns
      // NOTE: license_number column does not exist in the database - do not include it
      const { data: landscaperData, error: landscaperError } = await supabase
        .from('landscapers')
        .select('id, user_id, business_name, approved, insurance_verified, stripe_connect_id, created_at, updated_at')
        .order('created_at', { ascending: false });

      console.log('[LandscaperApprovalPanel] Fetched landscapers:', landscaperData?.length || 0);

      if (landscaperError) throw landscaperError;
      
      if (!landscaperData || landscaperData.length === 0) {
        setLandscapers([]);
        setLoading(false);
        return;
      }

      // Get landscaper IDs for work area queries
      const landscaperIds = landscaperData.map(l => l.id);

      // Get user_ids to fetch profile data
      const userIds = landscaperData.map(l => l.user_id).filter(Boolean);
      
      // Fetch profile data, work areas, and excluded areas in parallel
      const [profileResult, workAreasResult, excludedAreasResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email, phone')
          .in('user_id', userIds),
        supabase
          .from('landscaper_work_areas')
          .select('id, landscaper_id, zip_code, radius_miles, is_temporary, auto_added')
          .in('landscaper_id', landscaperIds),
        supabase
          .from('landscaper_excluded_areas')
          .select('id, landscaper_id, zip_code, reason')
          .in('landscaper_id', landscaperIds)
      ]);

      if (profileResult.error) {
        console.error('Error fetching profiles:', profileResult.error);
      }

      // Create maps for efficient lookup
      const profileMap = new Map(
        (profileResult.data || []).map(p => [p.user_id, p])
      );
      
      const workAreasMap = new Map<string, WorkArea[]>();
      (workAreasResult.data || []).forEach(wa => {
        const existing = workAreasMap.get(wa.landscaper_id) || [];
        existing.push({
          id: wa.id,
          zip_code: wa.zip_code,
          radius_miles: wa.radius_miles,
          is_temporary: wa.is_temporary,
          auto_added: wa.auto_added
        });
        workAreasMap.set(wa.landscaper_id, existing);
      });
      
      const excludedAreasMap = new Map<string, ExcludedArea[]>();
      (excludedAreasResult.data || []).forEach(ea => {
        const existing = excludedAreasMap.get(ea.landscaper_id) || [];
        existing.push({
          id: ea.id,
          zip_code: ea.zip_code,
          reason: ea.reason
        });
        excludedAreasMap.set(ea.landscaper_id, existing);
      });

      // Combine landscaper and profile data
      const combinedData: Landscaper[] = landscaperData.map(l => {
        const profile = profileMap.get(l.user_id) || {};
        return {
          id: l.id,
          user_id: l.user_id,
          first_name: (profile as any).first_name || '',
          last_name: (profile as any).last_name || '',
          email: (profile as any).email || '',
          phone: (profile as any).phone || '',
          business_name: l.business_name || '',
          approved: l.approved || false,
          documents_uploaded: !!(l.insurance_verified),
          insurance_file: l.insurance_verified ? 'verified' : '',
          license_file: '',
          approval_date: l.updated_at || '',
          created_at: l.created_at || '',
          work_areas: workAreasMap.get(l.id) || [],
          excluded_areas: excludedAreasMap.get(l.id) || []
        };
      });

      setLandscapers(combinedData);
    } catch (err) {
      console.error('Error fetching landscapers:', err);
      setError('Failed to load landscapers');
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
      
      // Update landscaper approval status using correct column name
      const { error: updateError } = await supabase
        .from('landscapers')
        .update({
          approved: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', landscaperId);

      if (updateError) throw updateError;


      // Log approval action (wrapped in try-catch in case table doesn't exist)
      try {
        await supabase
          .from('approval_logs')
          .insert({
            landscaper_id: landscaperId,
            admin_id: user.user.id,
            action,
            reason: `Admin ${action} landscaper via dashboard`
          });
      } catch (logError) {
        console.warn('Could not log approval action:', logError);
      }

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
          ? { ...l, approved, approval_date: approved ? new Date().toISOString() : '' }
          : l
      )
    );
  };
  // Auth loading guard
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-400 mb-2">{error}</p>
        <Button onClick={fetchLandscapers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Data loading state
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
