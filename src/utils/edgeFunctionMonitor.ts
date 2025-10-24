import { supabase } from '@/lib/supabase';

interface EdgeFunctionMetrics {
  function_name: string;
  invocations: number;
  errors: number;
  avg_latency: number;
  error_rate: number;
  last_error?: string;
  timestamp: string;
}

interface FunctionCall {
  functionName: string;
  startTime: number;
  success: boolean;
  error?: string;
  responseTime: number;
}

class EdgeFunctionMonitor {
  private static instance: EdgeFunctionMonitor;
  private metrics: Map<string, EdgeFunctionMetrics> = new Map();
  private calls: FunctionCall[] = [];

  static getInstance(): EdgeFunctionMonitor {
    if (!EdgeFunctionMonitor.instance) {
      EdgeFunctionMonitor.instance = new EdgeFunctionMonitor();
    }
    return EdgeFunctionMonitor.instance;
  }

  async trackFunctionCall<T>(
    functionName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const responseTime = Date.now() - startTime;
      
      this.recordCall({
        functionName,
        startTime,
        success: true,
        responseTime
      });
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.recordCall({
        functionName,
        startTime,
        success: false,
        error: errorMessage,
        responseTime
      });
      
      throw error;
    }
  }

  private recordCall(call: FunctionCall): void {
    this.calls.push(call);
    this.updateMetrics(call);
    
    // Keep only last 1000 calls to prevent memory issues
    if (this.calls.length > 1000) {
      this.calls = this.calls.slice(-1000);
    }
  }

  private updateMetrics(call: FunctionCall): void {
    const existing = this.metrics.get(call.functionName);
    
    if (existing) {
      const totalCalls = existing.invocations + 1;
      const totalErrors = existing.errors + (call.success ? 0 : 1);
      const avgLatency = (existing.avg_latency * existing.invocations + call.responseTime) / totalCalls;
      
      this.metrics.set(call.functionName, {
        ...existing,
        invocations: totalCalls,
        errors: totalErrors,
        avg_latency: Math.round(avgLatency),
        error_rate: Math.round((totalErrors / totalCalls) * 100),
        last_error: call.error || existing.last_error,
        timestamp: new Date().toISOString()
      });
    } else {
      this.metrics.set(call.functionName, {
        function_name: call.functionName,
        invocations: 1,
        errors: call.success ? 0 : 1,
        avg_latency: call.responseTime,
        error_rate: call.success ? 0 : 100,
        last_error: call.error,
        timestamp: new Date().toISOString()
      });
    }
  }

  async persistMetrics(): Promise<void> {
    try {
      const metricsArray = Array.from(this.metrics.values());
      
      if (metricsArray.length === 0) return;
      
      await supabase
        .from('edge_function_metrics')
        .upsert(metricsArray, {
          onConflict: 'function_name'
        });
        
    } catch (error) {
      console.error('Failed to persist edge function metrics:', error);
    }
  }

  getMetrics(): EdgeFunctionMetrics[] {
    return Array.from(this.metrics.values());
  }

  getHealthReport(): {
    totalFunctions: number;
    healthyFunctions: number;
    criticalFunctions: number;
    avgErrorRate: number;
    avgLatency: number;
  } {
    const metrics = this.getMetrics();
    
    return {
      totalFunctions: metrics.length,
      healthyFunctions: metrics.filter(m => m.error_rate < 5).length,
      criticalFunctions: metrics.filter(m => m.error_rate > 20).length,
      avgErrorRate: Math.round(metrics.reduce((sum, m) => sum + m.error_rate, 0) / metrics.length || 0),
      avgLatency: Math.round(metrics.reduce((sum, m) => sum + m.avg_latency, 0) / metrics.length || 0)
    };
  }
}

export const edgeFunctionMonitor = EdgeFunctionMonitor.getInstance();

// Auto-persist metrics every 5 minutes
setInterval(() => {
  edgeFunctionMonitor.persistMetrics();
}, 5 * 60 * 1000);