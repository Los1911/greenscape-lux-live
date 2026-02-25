// src/professionals/types-and-actions.ts
// Premium-safe types + helpers + actions (no UI changes)

import { Job, JobStatus as CanonicalJobStatus } from '@/types/job';

// Re-export canonical Job type
export type { Job } from '@/types/job';

export type JobStatus = "scheduled" | "active" | "completed" | "canceled";

export type CommType = "call" | "sms" | "email" | "note";

export interface DayPoint { date: string; amount: number }

export function normalizeStatus(s: string | null | undefined): JobStatus {
  const v = String(s ?? "").trim().toLowerCase().replace(" ", "_");
  if (v === "active" || v === "completed" || v === "canceled") return v as JobStatus;
  return "scheduled";
}

export function isTodayISO(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function friendlyDate(iso?: string | null): string {
  if (!iso) return "TBA";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function friendlyTime(iso?: string | null): string {
  if (!iso) return "TBA";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function currency(n?: number | null): string {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0)); }
  catch { return `$${Number(n || 0).toFixed(2)}`; }
}
