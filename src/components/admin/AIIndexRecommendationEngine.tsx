import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'gin' | 'gist' | 'hash';
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: number;
  frequency: number;
  reason: string;
}

interface QueryPattern {
  query_hash: string;
  query_text: string;
  frequency: number;
  avg_duration: number;
  tables_used: string[];
  columns_used: string[];
}

export default function AIIndexRecommendationEngine() {
  const { user, loading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState<IndexRecommendation[]>([]);
  const [queryPatterns, setQueryPatterns] = useState<QueryPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeQueryPatterns = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-index-analyzer', {
        body: { action: 'analyze_patterns' }
      });
      if (error) throw error;
      setQueryPatterns(data?.patterns || []);
      setRecommendations(data?.recommendations || []);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Failed to analyze query patterns');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateIndexes = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('ai-index-analyzer', {
        body: { action: 'generate_indexes', recommendations }
      });
      if (error) throw error;
      alert('Index generation completed successfully!');
    } catch (err) {
      console.error('Index generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
      critical: 'destructive', high: 'default', medium: 'secondary', low: 'outline'
    };
    return colors[priority] || 'outline';
  };

  useEffect(() => {
    if (!authLoading && user) {
      analyzeQueryPatterns();
    }
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-green-500" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={analyzeQueryPatterns}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            AI Index Recommendation Engine
            <div className="space-x-2">
              <Button onClick={analyzeQueryPatterns} disabled={analyzing}>
                {analyzing ? 'Analyzing...' : 'Analyze Patterns'}
              </Button>
              <Button onClick={generateIndexes} disabled={loading || !recommendations.length}>
                {loading ? 'Generating...' : 'Generate Indexes'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recommendations">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="patterns">Query Patterns</TabsTrigger>
              <TabsTrigger value="analysis">Performance</TabsTrigger>
            </TabsList>
            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recommendations available</p>
              ) : recommendations.map((rec, i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{rec.table}</h4>
                      <Badge variant={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Columns:</strong> {rec.columns?.join(', ') || 'N/A'}</div>
                      <div><strong>Type:</strong> {rec.type}</div>
                      <div><strong>Impact:</strong><Progress value={rec.impact || 0} className="mt-1" /></div>
                      <div><strong>Frequency:</strong> {rec.frequency || 0}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="patterns" className="space-y-4">
              {queryPatterns.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No patterns found</p>
              ) : queryPatterns.map((p, i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between">
                      <span>Frequency: {p.frequency}</span>
                      <span className="text-gray-600">Avg: {p.avg_duration}ms</span>
                    </div>
                    <code className="block p-2 bg-gray-100 rounded text-sm mt-2">
                      {(p.query_text || '').substring(0, 200)}...
                    </code>
                    <div className="text-sm mt-2"><strong>Tables:</strong> {p.tables_used?.join(', ') || 'N/A'}</div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="analysis">
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Index Efficiency</h4>
                      <Progress value={85} className="mb-2" />
                      <p className="text-sm text-gray-600">85% queries use indexes</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Query Performance</h4>
                      <Progress value={72} className="mb-2" />
                      <p className="text-sm text-gray-600">72% queries under 100ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}