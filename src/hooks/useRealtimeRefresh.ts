import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscription {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  /** Optional filter in format 'column=eq.value' */
  filter?: string;
}

interface UseRealtimeRefreshOptions {
  /** Unique channel name — must be globally unique per component instance */
  channelName: string;
  /** Tables and optional filters to subscribe to */
  subscriptions: RealtimeSubscription[];
  /** Whether the subscription is enabled (e.g. user is authenticated) */
  enabled?: boolean;
  /** Minimum interval between triggers in ms (debounce). Default 2000 */
  debounceMs?: number;
}

/**
 * Subscribes to Supabase Realtime postgres_changes for the given tables.
 * Returns a monotonically increasing `refreshTrigger` number that increments
 * each time a matching change event is received.
 *
 * Child components should include `refreshTrigger` in their useEffect
 * dependency arrays to re-fetch data when it changes.
 *
 * Cleanup is automatic on unmount.
 */
export function useRealtimeRefresh({
  channelName,
  subscriptions,
  enabled = true,
  debounceMs = 2000,
}: UseRealtimeRefreshOptions): number {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTriggerRef = useRef(0);

  const handleChange = useCallback(() => {
    const now = Date.now();
    if (now - lastTriggerRef.current < debounceMs) {
      return; // Debounce: skip if too soon after last trigger
    }
    lastTriggerRef.current = now;
    setRefreshTrigger((prev) => prev + 1);
  }, [debounceMs]);

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) return;

    // Build channel with all subscriptions
    let channel = supabase.channel(channelName);

    for (const sub of subscriptions) {
      const config: Record<string, unknown> = {
        event: sub.event || '*',
        schema: 'public',
        table: sub.table,
      };
      if (sub.filter) {
        config.filter = sub.filter;
      }

      channel = channel.on(
        'postgres_changes' as any,
        config,
        (payload: any) => {
          console.log(
            `[Realtime:${channelName}] ${payload.eventType} on ${sub.table}`,
            payload.new?.id || payload.old?.id || ''
          );
          handleChange();
        }
      );
    }

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime:${channelName}] Subscribed to ${subscriptions.length} table(s)`);
      }
      if (status === 'CHANNEL_ERROR') {
        console.warn(`[Realtime:${channelName}] Channel error — will retry`);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log(`[Realtime:${channelName}] Cleaning up channel`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // Re-subscribe if subscriptions config changes (e.g. user ID changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, channelName, JSON.stringify(subscriptions), handleChange]);

  return refreshTrigger;
}
