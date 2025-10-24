import type { JobInsert } from '@/types/job';

/**
 * Validates that a job insert has all required NOT NULL fields
 * @throws Error if validation fails
 */
export function validateJobInsert(job: Partial<JobInsert>): asserts job is JobInsert {
  if (!job.service_name || job.service_name.trim() === '') {
    throw new Error('service_name is required and cannot be empty');
  }
  
  if (!job.customer_name || job.customer_name.trim() === '') {
    throw new Error('customer_name is required and cannot be empty');
  }
  
  if (!job.status || job.status.trim() === '') {
    throw new Error('status is required and cannot be empty');
  }
}

/**
 * Ensures a customer_name is present, deriving from email if needed
 * @param email - Customer email address
 * @param name - Customer name (if available)
 * @returns Valid customer name
 * @throws Error if neither email nor name provided
 */
export function ensureCustomerName(email?: string | null, name?: string | null): string {
  if (name && name.trim() !== '') {
    return name.trim();
  }
  
  if (email && email.trim() !== '') {
    const derived = email.split('@')[0];
    if (derived && derived.trim() !== '') {
      return derived.trim();
    }
  }
  
  throw new Error('Either customer_name or email must be provided');
}

/**
 * Validates and normalizes a job status
 */
export function normalizeJobStatus(status: string | null | undefined): string {
  const normalized = String(status ?? 'pending').trim().toLowerCase();
  
  const validStatuses = ['pending', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled', 'rescheduled'];
  
  if (validStatuses.includes(normalized)) {
    return normalized;
  }
  
  return 'pending';
}
