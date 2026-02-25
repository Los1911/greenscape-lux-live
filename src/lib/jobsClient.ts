import { supabase } from './supabase';
import type { Job, JobInsert, JobUpdate } from '@/types/job';
import { validateJobInsert } from './jobValidation';

/**
 * Type-safe client for jobs table operations
 * All queries use explicit column selection to prevent schema drift
 */
export const jobsClient = {
  /**
   * Get all jobs with optional filtering
   */
  async getAll(filters?: { status?: string; landscaper_id?: string; client_id?: string }) {
    let query = supabase
      .from('jobs')
      .select('id, service_name, service_type, service_address, price, preferred_date, status, customer_name, created_at, updated_at');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    return query.order('created_at', { ascending: false });
  },

  /**
   * Get job by ID
   */
  async getById(id: string) {
    return supabase
      .from('jobs')
      .select('id, service_name, service_type, service_address, price, preferred_date, status, customer_name, created_at, updated_at')
      .eq('id', id)
      .single();
  },

  /**
   * Create new job with validation
   * Note: Returns only error status for RLS compatibility - use getById after insert if data needed
   */
  async create(job: JobInsert): Promise<{ error: any }> {
    // Validate required fields
    validateJobInsert(job);
    
    const { error } = await supabase
      .from('jobs')
      .insert(job);
    
    return { error };
  },


  /**
   * Update existing job
   * Note: Returns only error status for RLS compatibility - use getById after update if data needed
   */
  async update(id: string, updates: JobUpdate): Promise<{ error: any }> {
    const { error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id);
    
    return { error };
  },


  /**
   * Delete job
   */
  async delete(id: string) {
    return supabase
      .from('jobs')
      .delete()
      .eq('id', id);
  }
};
