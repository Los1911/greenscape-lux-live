import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Calendar, FileText, Loader2, AlertCircle } from 'lucide-react';

type QuoteRow = {
  id: string;
  services: string | null;
  address: string | null;
  preferred_date: string | null;
  comments: string | null;
  status?: string | null;
  created_at: string;
  full_name?: string | null;
};

export default function ClientRequestsCard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<QuoteRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        if (!user?.email) {
          setRows([]);
          setLoading(false);
          return;
        }

        // Updated to use client_quotes table instead of quote_requests
        const { data, error } = await supabase
          .from('client_quotes')
          .select('id, services, address, preferred_date, comments, status, created_at, full_name')
          .ilike('email', user.email)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setRows(data ?? []);
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load requests.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  return (
    <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl ring-1 ring-emerald-500/20 shadow-[0_0_35px_-10px_rgba(16,185,129,0.35)]">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-emerald-300">My Requests</h2>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-gray-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading your recent requests…</span>
          </div>
        )}

        {!loading && err && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{err}</span>
          </div>
        )}

        {!loading && !err && (!rows || rows.length === 0) && (
          <div className="text-gray-400">No requests yet. When you submit a quote, it'll appear here.</div>
        )}

        {!loading && !err && rows && rows.length > 0 && (
          <ul className="space-y-3">
            {rows.map((r) => {
              const date = r.preferred_date ? new Date(r.preferred_date).toLocaleDateString() : 'TBD';
              const created = r.created_at ? new Date(r.created_at).toLocaleDateString() : '';
              const status = r.status ?? 'pending';
              return (
                <li key={r.id} className="rounded-xl bg-black/40 border border-gray-700/50 p-3 hover:border-emerald-500/30 transition">
                   <div className="flex items-center justify-between">
                     <div className="text-sm font-medium text-emerald-300">
                       {r.services || 'Requested Services'}
                     </div>
                     <div className="text-xs text-gray-400">{created}</div>
                   </div>
                  <div className="mt-1 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Preferred: {date}
                    </div>
                     {r.address && (
                       <div className="mt-0.5">Address: {r.address}</div>
                     )}
                  </div>
                   <div className="mt-2 flex items-center justify-between">
                     <div className="text-xs">
                       <span className="text-gray-400 mr-1">Status:</span>
                       <span className="text-emerald-300 font-medium">{status}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                         {status}
                       </span>
                     </div>
                   </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}