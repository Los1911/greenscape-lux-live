import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Database, TrendingUp, AlertCircle } from 'lucide-react';

interface IndexStat {
  tableName: string;
  indexName: string;
  scans: number;
  tupleReads: number;
  tuplesFetched: number;
  size: string;
  usage: number;
}

export const IndexUsageStats: React.FC = () => {
  const [indexes, setIndexes] = useState<IndexStat[]>([]);

  useEffect(() => {
    // Mock data - in real app would fetch from supabase.rpc('get_index_usage_stats')
    setIndexes([
      {
        tableName: 'jobs',
        indexName: 'idx_jobs_client_id',
        scans: 1250,
        tupleReads: 45000,
        tuplesFetched: 12000,
        size: '2.1 MB',
        usage: 95
      },
      {
        tableName: 'users',
        indexName: 'idx_users_email',
        scans: 890,
        tupleReads: 890,
        tuplesFetched: 890,
        size: '1.5 MB',
        usage: 88
      },
      {
        tableName: 'payments',
        indexName: 'idx_payments_job_id',
        scans: 650,
        tupleReads: 15000,
        tuplesFetched: 8500,
        size: '3.2 MB',
        usage: 75
      }
    ]);
  }, []);

  const getUsageBadge = (usage: number) => {
    if (usage > 80) return <Badge variant="default">High Usage</Badge>;
    if (usage > 50) return <Badge variant="secondary">Medium Usage</Badge>;
    return <Badge variant="destructive">Low Usage</Badge>;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Index Usage Statistics</h3>
      
      <div className="grid gap-4">
        {indexes.map((index, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <CardTitle className="text-sm">{index.indexName}</CardTitle>
                  {getUsageBadge(index.usage)}
                </div>
                <span className="text-sm text-muted-foreground">{index.tableName}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Usage Efficiency</span>
                    <span>{index.usage}%</span>
                  </div>
                  <Progress value={index.usage} />
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Scans:</span>
                    <div>{index.scans.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="font-medium">Reads:</span>
                    <div>{index.tupleReads.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="font-medium">Fetched:</span>
                    <div>{index.tuplesFetched.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="font-medium">Size:</span>
                    <div>{index.size}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};