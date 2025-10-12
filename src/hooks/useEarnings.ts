import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EarningsData {
  totals: {
    allTime: number;
    month: number;
    day: number;
  };
  series: Array<{
    x: string;
    y: number;
  }>;
}

export const useEarnings = () => {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        setEarnings(null);
        return;
      }

      const { data, error } = await supabase.rpc('get_dashboard_earnings', {
        landscaper_uuid: userId,
      });

      if (error) {
        throw error;
      }

      const series = (data?.last_30_days ?? []).map((p: any) => ({ 
        x: p.d, 
        y: Number(p.y || 0) 
      }));

      const mappedData: EarningsData = {
        totals: {
          allTime: Number(data?.all_time_earnings ?? 0),
          month: Number(data?.monthly_earnings ?? 0),
          day: Number(data?.daily_earnings ?? 0),
        },
        series,
      };

      setEarnings(mappedData);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch earnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const refetch = async () => {
    await fetchEarnings();
  };

  return {
    earnings,
    loading,
    error,
    refetch
  };
};