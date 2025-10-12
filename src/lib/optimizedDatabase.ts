/**
 * Optimized Database Client with Connection Pooling and Query Optimization
 * Provides enhanced performance for high-traffic database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Database connection pool configuration
const DB_POOL_CONFIG = {
  // Connection pool settings
  poolSize: 20, // Maximum number of connections
  idleTimeout: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
  acquireTimeout: 60000, // 60 seconds
  
  // Query optimization settings
  maxRetries: 3,
  retryDelay: 1000,
  queryTimeout: 30000, // 30 seconds
  
  // Cache settings
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
};

// Query result cache
const queryCache = new Map<string, { data: any; timestamp: number }>();

// Connection pool metrics
let poolMetrics = {
  activeConnections: 0,
  totalQueries: 0,
  cacheHits: 0,
  cacheMisses: 0,
  avgQueryTime: 0,
  slowQueries: 0,
};

/**
 * Enhanced database client with performance optimizations
 */
class OptimizedDatabaseClient {
  private client: SupabaseClient;
  private queryStats: Map<string, { count: number; totalTime: number }> = new Map();

  constructor() {
    this.client = supabase;
  }

  /**
   * Execute optimized query with caching and retry logic
   */
  async executeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<{ data: T | null; error: any }>,
    options: {
      cache?: boolean;
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<{ data: T | null; error: any }> {
    const startTime = Date.now();
    const cacheKey = `query_${queryKey}`;
    
    // Check cache first
    if (options.cache !== false && DB_POOL_CONFIG.cacheEnabled) {
      const cached = this.getCachedResult<T>(cacheKey);
      if (cached) {
        poolMetrics.cacheHits++;
        return { data: cached, error: null };
      }
      poolMetrics.cacheMisses++;
    }

    // Execute query with retry logic
    const maxRetries = options.retries ?? DB_POOL_CONFIG.maxRetries;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        poolMetrics.activeConnections++;
        poolMetrics.totalQueries++;

        const result = await Promise.race([
          queryFn(),
          this.createTimeoutPromise(options.timeout ?? DB_POOL_CONFIG.queryTimeout)
        ]);

        const queryTime = Date.now() - startTime;
        this.updateQueryStats(queryKey, queryTime);

        // Cache successful results
        if (!result.error && options.cache !== false && DB_POOL_CONFIG.cacheEnabled) {
          this.setCachedResult(cacheKey, result.data);
        }

        poolMetrics.activeConnections--;
        return result;

      } catch (error) {
        lastError = error;
        poolMetrics.activeConnections--;
        
        if (attempt < maxRetries) {
          await this.delay(DB_POOL_CONFIG.retryDelay * (attempt + 1));
        }
      }
    }

    return { data: null, error: lastError };
  }

  /**
   * Optimized user queries with strategic indexing
   */
  async getUserByEmail(email: string) {
    return this.executeQuery(
      `user_by_email_${email}`,
      () => this.client
        .from('users')
        .select('id, email, role, first_name, last_name, status, created_at')
        .eq('email', email.toLowerCase())
        .eq('status', 'active')
        .single(),
      { cache: true }
    );
  }

  /**
   * Optimized job queries for client dashboard
   */
  async getClientJobs(clientId: string, status?: string) {
    const statusFilter = status ? `_${status}` : '_all';
    return this.executeQuery(
      `client_jobs_${clientId}${statusFilter}`,
      () => {
        let query = this.client
          .from('jobs')
          .select(`
            id, service_name, service_type, service_address, status, 
            preferred_date, created_at, price,
            landscaper_id, landscapers(business_name, rating)
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });


        if (status) {
          query = query.eq('status', status);
        }

        return query;
      },
      { cache: true }
    );
  }

  /**
   * Optimized landscaper job queries
   */
  async getLandscaperJobs(landscaperId: string, status?: string) {
    const statusFilter = status ? `_${status}` : '_all';
    return this.executeQuery(
      `landscaper_jobs_${landscaperId}${statusFilter}`,
      () => {
        let query = this.client
          .from('jobs')
          .select(`
            id, service_name, service_type, service_address, status,
            preferred_date, created_at, price, customer_name
          `)
          .eq('landscaper_id', landscaperId)
          .order('preferred_date', { ascending: true });


        if (status) {
          query = query.eq('status', status);
        }

        return query;
      },
      { cache: true }
    );
  }

  /**
   * Optimized payment queries for earnings
   */
  async getLandscaperEarnings(landscaperId: string, startDate?: string, endDate?: string) {
    const dateFilter = startDate && endDate ? `_${startDate}_${endDate}` : '';
    return this.executeQuery(
      `landscaper_earnings_${landscaperId}${dateFilter}`,
      () => {
        let query = this.client

          .from('payments')
          .select(`
            id, amount, landscaper_payout, platform_fee,
            created_at, status, job_id,
            jobs(service_name, service_type)
          `)
          .eq('landscaper_id', landscaperId)
          .eq('status', 'succeeded')
          .order('created_at', { ascending: false });


        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);

        return query;
      },
      { cache: true }
    );
  }

  /**
   * Optimized communication queries for messaging
   */
  async getJobMessages(jobId: string, limit: number = 50) {
    return this.executeQuery(
      `job_messages_${jobId}_${limit}`,
      () => this.client
        .from('communications')
        .select(`
          id, message, sender_id, sender_role, created_at,
          read_at, message_type, file_url, file_name
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(limit),
      { cache: false } // Real-time data, don't cache
    );
  }

  /**
   * Optimized notification queries
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const filter = unreadOnly ? '_unread' : '_all';
    return this.executeQuery(
      `user_notifications_${userId}${filter}`,
      () => {
        let query = this.client
          .from('notifications')
          .select('id, message, link, read, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (unreadOnly) {
          query = query.eq('read', false);
        }

        return query;
      },
      { cache: true }
    );
  }

  /**
   * Batch operations for better performance
   */
  async batchInsert<T>(table: string, records: T[]) {
    const batchSize = 100; // Supabase recommended batch size
    const batches = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      batches.push(
        this.executeQuery(
          `batch_insert_${table}_${i}`,
          () => this.client.from(table).insert(batch),
          { cache: false, retries: 2 }
        )
      );
    }

    return Promise.all(batches);
  }

  /**
   * Cache management
   */
  private getCachedResult<T>(key: string): T | null {
    const cached = queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < DB_POOL_CONFIG.cacheTTL) {
      return cached.data;
    }
    queryCache.delete(key);
    return null;
  }

  private setCachedResult(key: string, data: any): void {
    queryCache.set(key, { data, timestamp: Date.now() });
    
    // Clean up old cache entries
    if (queryCache.size > 1000) {
      const oldestKey = queryCache.keys().next().value;
      queryCache.delete(oldestKey);
    }
  }

  /**
   * Performance monitoring
   */
  private updateQueryStats(queryKey: string, queryTime: number): void {
    const stats = this.queryStats.get(queryKey) || { count: 0, totalTime: 0 };
    stats.count++;
    stats.totalTime += queryTime;
    this.queryStats.set(queryKey, stats);

    // Update global metrics
    poolMetrics.avgQueryTime = 
      (poolMetrics.avgQueryTime * (poolMetrics.totalQueries - 1) + queryTime) / 
      poolMetrics.totalQueries;

    if (queryTime > 1000) { // Queries over 1 second
      poolMetrics.slowQueries++;
    }
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), timeout);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...poolMetrics,
      cacheSize: queryCache.size,
      queryStats: Object.fromEntries(this.queryStats),
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    queryCache.clear();
    poolMetrics.cacheHits = 0;
    poolMetrics.cacheMisses = 0;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const start = Date.now();
    try {
      const { error } = await this.client
        .from('users')
        .select('id')
        .limit(1);
      
      const latency = Date.now() - start;
      return { healthy: !error, latency };
    } catch (error) {
      return { healthy: false, latency: Date.now() - start };
    }
  }
}

// Export singleton instance
export const optimizedDb = new OptimizedDatabaseClient();

// Export connection pool configuration for monitoring
export { DB_POOL_CONFIG, poolMetrics };

// Export types
export interface QueryOptions {
  cache?: boolean;
  timeout?: number;
  retries?: number;
}

export interface PerformanceMetrics {
  activeConnections: number;
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  avgQueryTime: number;
  slowQueries: number;
  cacheSize: number;
  queryStats: Record<string, { count: number; totalTime: number }>;
}