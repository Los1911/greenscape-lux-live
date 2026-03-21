import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * useAdminLifecycleToasts
 *
 * Lightweight Supabase Realtime subscription that fires awareness toasts
 * for key lifecycle transitions visible to admin users:
 *
 *  1. quote_requests INSERT  → "New quote request received"
 *  2. jobs UPDATE to status  → "Job ready for review"
 *     'completed_pending_review' or 'flagged_review'
 *
 * Design constraints (per requirements):
 *  - No notification center, tables, SMS, email, or push
 *  - Toast-only, ephemeral awareness signals
 *  - Debounced to prevent toast spam on bulk operations
 *  - Auto-cleans up channel on unmount
 */

const CHANNEL_NAME = 'admin-lifecycle-toasts';

/** Minimum gap between toasts of the same type (ms) */
const DEBOUNCE_MS = 4000;

/** Job statuses that trigger the "ready for review" toast */
const PHOTO_REVIEW_STATUSES = new Set([
  'completed_pending_review',
  'flagged_review',
]);

export function useAdminLifecycleToasts(): void {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastQuoteToastRef = useRef(0);
  const lastPhotoToastRef = useRef(0);

  const showQuoteToast = useCallback(() => {
    const now = Date.now();
    if (now - lastQuoteToastRef.current < DEBOUNCE_MS) return;
    lastQuoteToastRef.current = now;

    toast({
      title: 'New quote request received',
      description: 'A customer submitted a new quote request.',
    });
  }, []);

  const showPhotoReviewToast = useCallback(() => {
    const now = Date.now();
    if (now - lastPhotoToastRef.current < DEBOUNCE_MS) return;
    lastPhotoToastRef.current = now;

    toast({
      title: 'Job ready for review',
      description: 'A completed job is awaiting photo approval.',
    });
  }, []);

  useEffect(() => {
    // Build a single channel with two subscriptions
    let channel = supabase.channel(CHANNEL_NAME);

    // ── Subscription 1: new quote requests ──────────────────
    channel = channel.on(
      'postgres_changes' as any,
      {
        event: 'INSERT',
        schema: 'public',
        table: 'quote_requests',
      },
      (payload: any) => {
        console.log(
          `[AdminLifecycleToasts] New quote request:`,
          payload.new?.id || ''
        );
        showQuoteToast();
      }
    );

    // ── Subscription 2: jobs entering photo review ──────────
    channel = channel.on(
      'postgres_changes' as any,
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs',
      },
      (payload: any) => {
        const newStatus = payload.new?.status;
        const oldStatus = payload.old?.status;

        // Only fire when transitioning INTO a review status
        // (not when already in review and being re-updated)
        if (
          newStatus &&
          PHOTO_REVIEW_STATUSES.has(newStatus) &&
          !PHOTO_REVIEW_STATUSES.has(oldStatus)
        ) {
          console.log(
            `[AdminLifecycleToasts] Job entered photo review:`,
            payload.new?.id,
            `(${oldStatus} → ${newStatus})`
          );
          showPhotoReviewToast();
        }
      }
    );

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log(
          `[AdminLifecycleToasts] Subscribed — listening for quote_requests INSERT + jobs photo-review transitions`
        );
      }
      if (status === 'CHANNEL_ERROR') {
        console.warn(
          `[AdminLifecycleToasts] Channel error — Supabase will auto-retry`
        );
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log(`[AdminLifecycleToasts] Cleaning up channel`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [showQuoteToast, showPhotoReviewToast]);
}
