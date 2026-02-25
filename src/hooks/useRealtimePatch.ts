import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePatchSubscription {
  table: string;
  event?: RealtimeEventType | '*';
  /** Supabase filter string, e.g. 'user_id=eq.abc123' */
  filter?: string;
}

export interface RealtimePatchOptions {
  /** Globally unique channel name per component instance */
  channelName: string;
  /** Tables + optional filters to subscribe to */
  subscriptions: RealtimePatchSubscription[];
  /** Whether the subscription is active */
  enabled?: boolean;
  /**
   * Called on every matching postgres_changes event.
   * Consumers use this to patch local state in-place.
   * This callback is NEVER wrapped in loading state.
   */
  onEvent: (
    eventType: RealtimeEventType,
    table: string,
    newRow: Record<string, any>,
    oldRow: Record<string, any>
  ) => void;
  /** Minimum ms between event deliveries (debounce). Default 500 */
  debounceMs?: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Subscribes to Supabase Realtime postgres_changes and delivers raw row
 * payloads to the consumer via `onEvent`. The consumer is responsible for
 * patching its own local state — this hook NEVER triggers loading states,
 * full re-fetches, or component remounts.
 *
 * Cleanup is automatic on unmount via `supabase.removeChannel()`.
 */
export function useRealtimePatch({
  channelName,
  subscriptions,
  enabled = true,
  onEvent,
  debounceMs = 500,
}: RealtimePatchOptions): void {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastEventRef = useRef(0);
  // Store onEvent in a ref so the channel doesn't need to re-subscribe
  // when the callback identity changes (which it will on every render
  // if the consumer doesn't memoize it).
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) return;

    // Build channel
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
          // ── DEBUG: log every raw event before debounce ──
          console.log(
            `[RealtimePatch:${channelName}] raw event: ${payload.eventType} ` +
            `table=${payload.table} id=${payload.new?.id?.slice?.(0, 8) ?? '?'}`
          );

          const now = Date.now();
          if (now - lastEventRef.current < debounceMs) {
            console.log(`[RealtimePatch:${channelName}] debounced (${debounceMs}ms)`);
            return;
          }
          lastEventRef.current = now;

          const eventType: RealtimeEventType = payload.eventType;
          const table: string = payload.table;
          const newRow = payload.new || {};
          const oldRow = payload.old || {};

          onEventRef.current(eventType, table, newRow, oldRow);
        }
      );

    }

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[RealtimePatch:${channelName}] subscribed`);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // Only re-subscribe when channelName, enabled, or subscription config changes.
    // We intentionally exclude onEvent (stored in ref) and debounceMs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled, JSON.stringify(subscriptions)]);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a state patcher for a simple `T[]` state managed by `useState`.
 *
 * - INSERT → prepend (skip if id already exists)
 * - UPDATE → merge into existing row by id
 * - DELETE → remove by id
 *
 * The optional `transform` function normalizes the raw Supabase row into
 * the component's local type (e.g. `normalizeJobData`).
 *
 * Usage:
 * ```ts
 * const patcher = useMemo(() => patchArray(setJobs, normalizeJobData), []);
 *
 * useRealtimePatch({
 *   channelName: 'admin-jobs',
 *   subscriptions: [{ table: 'jobs' }],
 *   enabled: true,
 *   onEvent: (eventType, table, newRow, oldRow) => {
 *     if (table === 'jobs') patcher(eventType, newRow, oldRow);
 *   },
 * });
 * ```
 */
export function patchArray<T extends { id: string }>(
  setState: React.Dispatch<React.SetStateAction<T[]>>,
  transform?: (raw: Record<string, any>) => T
): (eventType: RealtimeEventType, newRow: Record<string, any>, oldRow: Record<string, any>) => void {
  return (eventType, newRow, oldRow) => {
    setState((prev) => {
      if (eventType === 'INSERT') {
        const item = transform ? transform(newRow) : (newRow as T);
        // Guard against duplicates (Supabase can deliver the same event twice)
        if (prev.some((p) => p.id === item.id)) return prev;
        return [item, ...prev];
      }

      if (eventType === 'UPDATE') {
        const id = newRow.id;
        if (!id) return prev;
        const idx = prev.findIndex((p) => p.id === id);
        if (idx === -1) return prev;
        // Shallow merge — preserves fields not present in the payload
        const merged = transform
          ? transform({ ...prev[idx], ...newRow })
          : ({ ...prev[idx], ...newRow } as T);
        // Only create a new array if something actually changed
        if (merged === prev[idx]) return prev;
        const next = [...prev];
        next[idx] = merged;
        return next;
      }

      if (eventType === 'DELETE') {
        const id = oldRow?.id || newRow?.id;
        if (!id) return prev;
        return prev.filter((p) => p.id !== id);
      }

      return prev;
    });
  };
}

/**
 * Creates a "silent refetch" callback that calls the provided async function
 * WITHOUT toggling any loading state. Useful for components with complex
 * joined queries that can't be patched row-by-row.
 *
 * Includes a built-in cooldown to prevent rapid-fire refetches.
 *
 * Usage:
 * ```ts
 * const silentRefetch = useSilentRefetch(fetchPayoutQueue, 3000);
 *
 * useRealtimePatch({
 *   ...
 *   onEvent: () => silentRefetch(),
 * });
 * ```
 */
export function useSilentRefetch(
  fetchFn: () => Promise<void>,
  cooldownMs = 3000
): () => void {
  const lastCallRef = useRef(0);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  return useCallback(() => {
    const now = Date.now();
    if (now - lastCallRef.current < cooldownMs) return;
    lastCallRef.current = now;
    fetchRef.current().catch((err) => {
      console.warn('[silentRefetch] Background refresh failed:', err);
    });
  }, [cooldownMs]);
}
