import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { User, ChevronDown, Check, CheckCircle, Loader2, MapPin, AlertCircle, X } from 'lucide-react';


/* ─── Types ─────────────────────────────────────────────────── */

interface ApprovedLandscaper {
  id: string;           // landscapers.id (PK)
  user_id: string;      // landscapers.user_id (FK → auth.users)
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  business_name: string | null;
  service_areas: string[];  // derived from landscapers_service_areas
}

interface LandscaperAssignmentDropdownProps {
  jobId: string;
  jobStatus: string | null | undefined;
  currentLandscaperId: string | null | undefined;
  /** Payment status from the jobs table — assignment requires 'paid' */
  paymentStatus?: string | null | undefined;
  /** Called after successful assignment so parent can refetch */
  onAssigned?: () => void;
  /** Compact mode for inline table usage */
  compact?: boolean;
}


/* ─── Singleton cache so we don't re-fetch on every row ───── */

let _landscaperCache: ApprovedLandscaper[] | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

async function fetchApprovedLandscapers(forceRefresh = false): Promise<ApprovedLandscaper[]> {
  const now = Date.now();
  if (!forceRefresh && _landscaperCache && now - _cacheTimestamp < CACHE_TTL_MS) {
    console.log('[LandscaperDropdown] Using cached landscapers:', _landscaperCache.length);
    return _landscaperCache;
  }

  console.log('[LandscaperDropdown] Fetching fresh landscapers from DB...');

  // 1. Fetch approved landscapers
  const { data: landscapers, error: lErr } = await supabase
    .from('landscapers')
    .select('id, user_id, first_name, last_name, email, business_name')
    .eq('approved', true)
    .order('first_name', { ascending: true });

  if (lErr) throw lErr;
  if (!landscapers || landscapers.length === 0) {
    _landscaperCache = [];
    _cacheTimestamp = now;
    console.log('[LandscaperDropdown] No approved landscapers found');
    return [];
  }

  // 2. Fetch service areas for all approved landscapers
  const landscaperIds = landscapers.map(l => l.id);
  const { data: areas } = await supabase
    .from('landscapers_service_areas')
    .select('landscaper_id, city, state, zip_code')
    .in('landscaper_id', landscaperIds)
    .eq('is_active', true);

  // 3. Build area map
  const areaMap = new Map<string, string[]>();
  if (areas) {
    for (const a of areas) {
      const label = a.city && a.state
        ? `${a.city}, ${a.state}`
        : a.zip_code || '';
      if (!label) continue;
      const existing = areaMap.get(a.landscaper_id) || [];
      if (!existing.includes(label)) {
        existing.push(label);
        areaMap.set(a.landscaper_id, existing);
      }
    }
  }

  // 4. Merge
  const result: ApprovedLandscaper[] = landscapers.map(l => ({
    id: l.id,
    user_id: l.user_id,
    first_name: l.first_name,
    last_name: l.last_name,
    email: l.email,
    business_name: l.business_name,
    service_areas: areaMap.get(l.id) || [],
  }));

  _landscaperCache = result;
  _cacheTimestamp = now;
  console.log('[LandscaperDropdown] Fetched landscapers:', result.length);
  return result;
}

/** Invalidate cache so next render re-fetches */
export function invalidateLandscaperCache() {
  _landscaperCache = null;
  _cacheTimestamp = 0;
}

/* ─── Assignment gating ────────────────────────────────────
   Assignment is allowed when BOTH conditions are met:
     1. job.status is in ASSIGNABLE_STATUSES
     2. job.payment_status === 'paid'  (explicit payment confirmation)
   
   'priced' and 'available' are included so that rejected jobs
   (which revert to 'priced') can be immediately reassigned
   without requiring a status change.
─────────────────────────────────────────────────────────── */

const ASSIGNABLE_STATUSES = new Set(['scheduled', 'priced', 'available']);

/* ─── Statuses where the landscaper is locked (no reassignment) ── */
const LOCKED_STATUSES = new Set([
  'active',
  'completed_pending_review',
  'completed',
  'pending_review',
]);

/* ─── Statuses that should transition to 'assigned' on assignment ─
   When a landscaper is assigned to one of these statuses, the status
   advances to 'assigned' so it moves into the Active Jobs bucket
   in the Operations Control Center.
──────────────────────────────────────────────────────────────────── */
const TRANSITION_TO_ASSIGNED = new Set(['scheduled', 'priced', 'available']);


/* ─── Portal-positioned dropdown menu coordinates ─────────── */

interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
}

/* ─── Component ───────────────────────────────────────────── */

export function LandscaperAssignmentDropdown({
  jobId,
  jobStatus,
  currentLandscaperId,
  paymentStatus,
  onAssigned,
  compact = false,
}: LandscaperAssignmentDropdownProps) {
  const [landscapers, setLandscapers] = useState<ApprovedLandscaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
  const [menuPos, setMenuPos] = useState<DropdownPosition>({ left: 0, width: 280 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* ── Assignment gating ── */
  const statusAllowed = ASSIGNABLE_STATUSES.has(jobStatus || '');
  const paymentConfirmed = paymentStatus === 'paid';
  const canAssign = statusAllowed && paymentConfirmed;
  const isLocked = LOCKED_STATUSES.has(jobStatus || '');
  /* If status is right but payment isn't confirmed, show a "waiting for payment" hint */
  const awaitingPayment = statusAllowed && !paymentConfirmed;

  // Load approved landscapers when dropdown opens
  // Always force-refresh to avoid stale data after job state changes
  const loadLandscapers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Force refresh to ensure we always get fresh data
      // This fixes the issue where the dropdown is empty after job rejection
      const data = await fetchApprovedLandscapers(true);
      console.log('[LandscaperDropdown] Loaded landscapers for dropdown:', data.length);
      setLandscapers(data);
    } catch (err: any) {
      console.error('[LandscaperDropdown] Failed to load landscapers:', err);
      setError(err.message || 'Failed to load landscapers');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Re-fetch landscapers when jobId or jobStatus changes ── */
  useEffect(() => {
    if (canAssign) {
      // Invalidate cache when job context changes to ensure fresh data
      invalidateLandscaperCache();
    }
  }, [jobId, jobStatus, canAssign]);

  /* ── Calculate where the portal menu should appear ─────── */
  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Dropdown needs ~320px (max-h-64 = 256px + header ~44px + margin 8px)
    const dropdownHeight = 320;
    const gap = 8; // spacing between trigger and menu
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Decide direction
    let dir: 'down' | 'up' = 'down';
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      dir = 'up';
    }
    setOpenDirection(dir);

    // Calculate menu width — match trigger width, or use min 280 for compact
    const menuWidth = compact ? Math.max(256, rect.width) : Math.max(280, rect.width);

    // Calculate left — for compact mode, align right edge to trigger right edge
    let menuLeft = rect.left;
    if (compact) {
      menuLeft = rect.right - menuWidth;
      // Ensure it doesn't go off-screen left
      if (menuLeft < 8) menuLeft = 8;
    }
    // Ensure it doesn't go off-screen right
    if (menuLeft + menuWidth > window.innerWidth - 8) {
      menuLeft = window.innerWidth - menuWidth - 8;
    }

    if (dir === 'down') {
      setMenuPos({
        top: rect.bottom + gap,
        left: menuLeft,
        width: menuWidth,
      });
    } else {
      setMenuPos({
        bottom: window.innerHeight - rect.top + gap,
        left: menuLeft,
        width: menuWidth,
      });
    }
  }, [compact]);

  /* ── Close on outside click (works across portal boundary) ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Ignore clicks on the trigger button
      if (triggerRef.current?.contains(target)) return;
      // Ignore clicks inside the portal menu
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* ── Reposition on scroll / resize while open ────────────── */
  useEffect(() => {
    if (!open) return;
    const reposition = () => computePosition();
    window.addEventListener('scroll', reposition, true); // capture phase for nested scrolls
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, computePosition]);

  /* ── Toggle handler ──────────────────────────────────────── */
  const handleToggle = () => {
    if (!canAssign) return;
    const next = !open;
    if (next) {
      computePosition();
    }
    setOpen(next);
    if (next) loadLandscapers();
  };

  const handleAssign = async (landscaper: ApprovedLandscaper) => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // Build the update payload.
      // The DB constraint jobs_assignment_pairing_chk requires BOTH
      // assigned_to and landscaper_id to be set together (or both null).
      //   landscaper_id  → landscapers.id  (table PK)
      //   assigned_to    → landscapers.user_id  (auth.users FK)
      const updatePayload: Record<string, unknown> = {
        landscaper_id: landscaper.id,
        assigned_to: landscaper.user_id,
        updated_at: new Date().toISOString(),
      };

      // If the job is in a pre-assignment status (priced / available / scheduled),
      // advance it to 'assigned' so it moves into the Active Jobs bucket.
      if (TRANSITION_TO_ASSIGNED.has(jobStatus || '')) {
        updatePayload.status = 'assigned';
      }

      const { error: updateErr } = await supabase
        .from('jobs')
        .update(updatePayload)
        .eq('id', jobId);

      if (updateErr) throw updateErr;

      // Brief success feedback before parent refetch removes this row
      const assigneeName = [landscaper.first_name, landscaper.last_name].filter(Boolean).join(' ') || landscaper.email || 'Landscaper';
      setSuccessMsg(`Assigned to ${assigneeName}`);
      setOpen(false);

      // Allow the success message to display briefly, then trigger parent refresh
      setTimeout(() => {
        onAssigned?.();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Assignment failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // Clear both fields together to satisfy jobs_assignment_pairing_chk
      const { error: updateErr } = await supabase
        .from('jobs')
        .update({
          landscaper_id: null,
          assigned_to: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateErr) throw updateErr;

      setOpen(false);
      onAssigned?.();
    } catch (err: any) {
      setError(err.message || 'Unassign failed');
    } finally {
      setSaving(false);
    }
  };



  // Find current assignee display name
  const currentAssignee = landscapers.find(
    l => l.user_id === currentLandscaperId || l.id === currentLandscaperId
  );
  const currentLabel = currentAssignee
    ? [currentAssignee.first_name, currentAssignee.last_name].filter(Boolean).join(' ') || currentAssignee.email || 'Assigned'
    : currentLandscaperId
      ? `ID: ${currentLandscaperId.slice(0, 8)}…`
      : null;

  /* ── Not assignable: show static text ── */
  if (!canAssign) {
    if (isLocked && currentLabel) {
      return (
        <div className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}`}>
          <User className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <span className="text-purple-300 truncate">{currentLabel}</span>
          <span className="text-gray-600 text-[10px]">(locked)</span>
        </div>
      );
    }
    /* Status is assignable but payment_status is not 'paid' — show gated hint */
    if (awaitingPayment) {
      return (
        <div className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'} px-2 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5`}>
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-amber-300 truncate">Awaiting client payment</span>
        </div>
      );
    }
    return null; // Not in an assignable status → don't render anything
  }


  /* ── Portal menu content ── */
  const portalMenu = open
    ? createPortal(
        <>
          {/* Invisible backdrop to catch outside clicks and close */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setOpen(false)}
          />

          {/* The actual dropdown menu — rendered at document.body level
              so it escapes ALL parent stacking contexts (backdrop-blur, etc.) */}
          <div
            ref={menuRef}
            className="rounded-lg border border-emerald-500/20 bg-[#0B0F14] shadow-xl"
            style={{
              position: 'fixed',
              zIndex: 9999,
              width: menuPos.width,
              left: menuPos.left,
              ...(menuPos.top != null ? { top: menuPos.top } : {}),
              ...(menuPos.bottom != null ? { bottom: menuPos.bottom } : {}),
            }}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-gray-700/50 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Approved Landscapers</span>
              {currentLandscaperId && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleUnassign(); }}
                  className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Unassign
                </button>
              )}
            </div>

            {/* Scrollable list — max-h-64 keeps the dropdown compact; card never scrolls */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Loading…</span>
                </div>
              ) : landscapers.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  No approved landscapers found
                </div>
              ) : (
                landscapers.map(l => {
                  const name = [l.first_name, l.last_name].filter(Boolean).join(' ') || l.email || 'Unknown';
                  const isSelected = l.user_id === currentLandscaperId || l.id === currentLandscaperId;
                  const areaText = l.service_areas.length > 0
                    ? l.service_areas.slice(0, 2).join(' · ') + (l.service_areas.length > 2 ? ` +${l.service_areas.length - 2}` : '')
                    : null;

                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleAssign(l); }}
                      disabled={saving}
                      className={`
                        w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors
                        ${isSelected
                          ? 'bg-emerald-500/15 border-l-2 border-l-emerald-500'
                          : 'hover:bg-emerald-500/5 border-l-2 border-l-transparent'
                        }
                      `}
                    >
                      {/* Avatar circle */}
                      <div className={`
                        w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                        ${isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-gray-700/50 text-gray-400'}
                      `}>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <User className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-medium truncate ${isSelected ? 'text-emerald-300' : 'text-gray-200'}`}>
                            {name}
                          </span>
                        </div>
                        {l.business_name && (
                          <span className="text-[11px] text-gray-500 block truncate">
                            {l.business_name}
                          </span>
                        )}
                        {areaText && (
                          <span className="text-[10px] text-cyan-400/60 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{areaText}</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  /* ── Assignable: render trigger + portal ── */
  return (
    <div className={`relative ${compact ? '' : 'w-full'}`}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        disabled={saving}
        className={`
          flex items-center gap-2 rounded-lg border transition-colors w-full text-left
          ${compact
            ? 'px-2 py-1.5 text-xs'
            : 'px-3 py-2.5 text-sm'
          }
          ${currentLabel
            ? 'border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300'
            : 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300'
          }
          ${saving ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
        `}
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
        ) : (
          <User className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        <span className="truncate flex-1">
          {currentLabel || 'Assign Landscaper'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Success feedback — brief green indicator after assignment */}
      {successMsg && (
        <div className={`flex items-center gap-1.5 mt-1 text-emerald-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          <CheckCircle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{successMsg}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={`flex items-center gap-1.5 mt-1 text-red-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}


      {/* Dropdown renders via portal into document.body — escapes all stacking contexts */}
      {portalMenu}
    </div>
  );
}

export default LandscaperAssignmentDropdown;
