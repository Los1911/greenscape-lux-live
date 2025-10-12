// src/professionals/types-and-actions-part2.ts
// Supabase integration (typed wrappers)
import { Job, DayPoint, CommType } from "./types-and-actions";

type SupaClient = {
  from: (table: string) => any;
  auth: { getUser: () => Promise<{ data: { user?: { id?: string; email?: string } } }> };
};

export async function getAuthIdentity(supabase: SupaClient) {
  const { data } = await supabase.auth.getUser();
  return { uid: data.user?.id ?? null, email: data.user?.email ?? null };
}

export function landscaperOrFilter(uid: string | null, email: string | null) {
  const parts: string[] = []
  if (uid) {
    parts.push(`landscaper_id.eq.${uid}`)
    parts.push(`assigned_to.eq.${uid}`)
  }
  if (email) {
    parts.push(`landscaper_email.eq.${email}`)
    parts.push(`assigned_email.eq.${email}`)
  }
  return parts.join(",")
}

// Earnings last 30d from completed jobs -> DayPoint[]
export async function fetchEarningsLast30(supabase: SupaClient): Promise<DayPoint[]> {
  const { uid, email } = await getAuthIdentity(supabase);
  const start = new Date(); start.setHours(0,0,0,0); start.setDate(start.getDate() - 29);
  const or = landscaperOrFilter(uid, email);
  const { data, error } = await supabase.from("jobs")
    .select("completed_at,status,price,earnings")
    .or(or).gte("completed_at", start.toISOString()).eq("status", "completed");
  if (error || !data) return [];
  // If you store per-job earnings, prefer that; else fallback to price
  const byDay = new Map<string, number>();
  const seed = new Date(start);
  for (let i = 0; i < 30; i++) {
    const d = new Date(seed); d.setDate(seed.getDate() + i);
    byDay.set(d.toISOString().slice(0,10), 0);
  }
  for (const r of data as Array<{ completed_at?: string; earnings?: number; price?: number }>) {
    const k = (r.completed_at ?? "").slice(0,10);
    if (!k) continue;
    const val = Number((r.earnings ?? r.price) || 0);
    byDay.set(k, (byDay.get(k) || 0) + val);
  }
  return Array.from(byDay.entries()).sort((a,b)=>a[0]<b[0]?-1:1).map(([date, amount]) => ({ date, amount }));
}