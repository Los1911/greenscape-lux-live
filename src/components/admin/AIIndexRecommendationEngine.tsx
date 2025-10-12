import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';

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
  const [recommendations, setRecommendations] = useState<IndexRecommendation[]>([]);
  const [queryPatterns, setQueryPatterns] = useState<QueryPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeQueryPatterns = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-index-analyzer', {
        body: { action: 'analyze_patterns' }
      });
      
      if (error) throw error;
      setQueryPatterns(data.patterns || []);
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateIndexes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-index-analyzer', {
        body: { action: 'generate_indexes', recommendations }
      });
      
      if (error) throw error;
      alert('Index generation completed successfully!');
    } catch (error) {
      console.error('Index generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  useEffect(() => {
    analyzeQueryPatterns();
  }, []);

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
              <TabsTrigger value="analysis">Performance Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{rec.table}</h4>
                      <Badge variant={getPriorityColor(rec.priority)}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Columns:</strong> {rec.columns.join(', ')}
                      </div>
                      <div>
                        <strong>Type:</strong> {rec.type}
                      </div>
                      <div>
                        <strong>Impact Score:</strong>
                        <Progress value={rec.impact} className="mt-1" />
                      </div>
                      <div>
                        <strong>Query Frequency:</strong> {rec.frequency}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              {queryPatterns.map((pattern, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Frequency: {pattern.frequency}</span>
                        <span className="text-sm text-gray-600">
                          Avg Duration: {pattern.avg_duration}ms
                        </span>
                      </div>
                      <code className="block p-2 bg-gray-100 rounded text-sm">
                        {pattern.query_text.substring(0, 200)}...
                      </code>
                      <div className="text-sm">
                        <strong>Tables:</strong> {pattern.tables_used.join(', ')}
                      </div>
                    </div>
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
                      <p className="text-sm text-gray-600">85% of queries use indexes</p>
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