import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAuditLogs, AuditLog } from '@/utils/AuditTracker';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';

export default function SystemLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const auditLogs = await getAuditLogs({ limit: 100 });
      setLogs(auditLogs);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventBadgeColor = (type: string) => {
    if (type.includes('success') || type.includes('approved')) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (type.includes('failed') || type.includes('error')) return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (type.includes('logout')) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  return (
    <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-emerald-400" />
          <div>
            <CardTitle className="text-white">System Logs</CardTitle>
            <CardDescription className="text-emerald-300/70">Last 100 audit events</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 text-red-400 py-8 justify-center">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No audit logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-emerald-500/20 hover:bg-transparent">
                  <TableHead className="text-emerald-300">Event Type</TableHead>
                  <TableHead className="text-emerald-300">User ID</TableHead>
                  <TableHead className="text-emerald-300">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-emerald-500/10 hover:bg-emerald-500/5">
                    <TableCell>
                      <Badge className={getEventBadgeColor(log.type)}>
                        {log.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300 font-mono text-sm">
                      {log.user_id || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {formatTimestamp(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
