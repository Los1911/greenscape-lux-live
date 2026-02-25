import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealTimeDataOptions {
  table: string;
  filter?: { column: string; value: any };
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

export function useRealTimeData<T = any>({
  table,
  filter,
  select = '*',
  orderBy,
  limit
}: UseRealTimeDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // CRITICAL: Skip if filter value is empty/null/undefined
    if (filter && (!filter.value || filter.value === '')) {
      setLoading(false);
      setData([]);
      return;
    }

    fetchInitialData();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, filter?.column, filter?.value]);

  const fetchInitialData = async () => {
    if (filter && (!filter.value || filter.value === '')) {
      setLoading(false);
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).select(select);

      if (filter) {
        query = query.eq(filter.column, filter.value);
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;

      setData(result || []);
    } catch (err) {
      console.error(`Error fetching data from ${table}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (filter && (!filter.value || filter.value === '')) return;
    
    const channelName = `realtime-${table}-${filter?.column || 'all'}-${filter?.value || 'all'}`;
    
    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
      }, (payload) => {
        handleRealtimeChange(payload);
      })
      .subscribe();
  };

  const handleRealtimeChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setData(currentData => {
      switch (eventType) {
        case 'INSERT':
          if (filter && newRecord[filter.column] !== filter.value) return currentData;
          return [newRecord, ...currentData];
        case 'UPDATE':
          return currentData.map(item => (item as any).id === newRecord.id ? newRecord : item);
        case 'DELETE':
          return currentData.filter(item => (item as any).id !== oldRecord.id);
        default:
          return currentData;
      }
    });
  };

  const refetch = () => fetchInitialData();

  return { data, loading, error, refetch };
}

export function useNotifications(userId: string) {
  return useRealTimeData({
    table: 'notifications',
    filter: { column: 'user_id', value: userId },
    select: 'id, title, message, type, created_at, read',
    orderBy: { column: 'created_at', ascending: false },
    limit: 20
  });
}

export function useJobUpdates(userId: string, userRole: 'client' | 'landscaper') {
  // For clients, we query by user_id OR client_email
  // For landscapers, query by landscaper_id
  // Note: The RLS policy handles the OR logic, but we use user_id as the primary filter
  // The component should handle the OR logic for client_email separately if needed
  const filterColumn = userRole === 'client' ? 'user_id' : 'landscaper_id';
  
  return useRealTimeData({
    table: 'jobs',
    filter: { column: filterColumn, value: userId },
    select: 'id, service_name, service_type, service_address, status, created_at, preferred_date, price, client_email, user_id',
    orderBy: { column: 'created_at', ascending: false },
    limit: 10
  });

}



export function useEarningsData(landscaperId: string) {
  return useRealTimeData({
    table: 'payments',
    filter: { column: 'landscaper_id', value: landscaperId },
    select: 'id, amount, status, created_at, job_id',
    orderBy: { column: 'created_at', ascending: false }
  });
}
