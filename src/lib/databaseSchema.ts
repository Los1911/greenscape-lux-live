/**
 * Database Schema Utility
 * 
 * This file provides:
 * 1. Explicit column definitions for all key tables (no SELECT *)
 * 2. Null-safe helpers for optional/new columns
 * 3. Type-safe column selection strings
 * 4. Graceful fallback handling for missing columns
 * 
 * IMPORTANT: Always use these column definitions instead of select('*')
 * to prevent runtime crashes from missing or renamed columns.
 */

// ============================================
// JOBS TABLE COLUMNS
// ============================================
export const JOBS_COLUMNS = {
  // Core columns (always exist)
  core: [
    'id',
    'status',
    'created_at',
    'updated_at',
  ],
  
  // Standard columns (should exist in most deployments)
  standard: [
    'id',
    'client_id',
    'landscaper_id',
    'service_type',
    'service_name',
    'service_address',
    'status',
    'price',
    'created_at',
    'updated_at',
    'scheduled_date',
    'completed_at',
    'preferred_date',
  ],
  
  // Extended columns (may not exist in all deployments)
  extended: [
    'id',
    'client_id',
    'landscaper_id',
    'user_id',
    'title',
    'description',
    'service_type',
    'service_name',
    'service_address',
    'property_address',
    'property_city',
    'property_state',
    'property_zip',
    'preferred_date',
    'budget_min',
    'budget_max',
    'status',
    'urgency',
    'square_footage',
    'special_requirements',
    'photos',
    'created_at',
    'updated_at',
    'price',
    'earnings',
    'customer_name',

    'client_email',
    'landscaper_email',
    'assigned_to',
    'assigned_email',
    'is_available',
    'location',
    'location_lat',
    'location_lng',
    'started_at',
    'flagged_at',
    'scheduled_date',
    'actual_start_time',

    'remediation_status',
    'remediation_deadline',
  ],
  
  // Client dashboard view
  clientView: 'id, service_name, service_type, service_address, status, price, created_at, scheduled_date, completed_at, preferred_date, landscaper_email',
  
  // Landscaper dashboard view — only columns confirmed to exist in jobs table
  // REMOVED: 'amount' (42703), 'earnings' (unconfirmed), 'comments' (42703), 'estimated_duration' (unconfirmed)
  landscaperView: 'id, service_name, service_type, service_address, status, price, created_at, scheduled_date, completed_at, preferred_date, customer_name, client_email, is_available, assigned_to, landscaper_id, started_at, selected_services',


  
  // Admin view
  adminView: 'id, service_name, service_type, service_address, status, price, created_at, updated_at, customer_name, client_email, landscaper_id, landscaper_email, preferred_date',
  
  // Minimal view for counts/stats
  minimal: 'id, status, price, created_at',
} as const;

// ============================================
// JOB_PHOTOS TABLE COLUMNS
// ============================================
export const JOB_PHOTOS_COLUMNS = {
  core: [
    'id',
    'job_id',
    'created_at',
  ],
  
  standard: [
    'id',
    'job_id',
    'file_url',
    'photo_url',
    'type',
    'photo_type',
    'uploaded_at',
    'created_at',
    'sort_order',
  ],
  
  // Standard select string
  select: 'id, job_id, file_url, photo_url, type, photo_type, uploaded_at, created_at, sort_order, caption',
  
  // Minimal select
  minimal: 'id, job_id, file_url, photo_url, type, photo_type',
} as const;

// ============================================
// JOB_ADDONS TABLE COLUMNS
// ============================================
export const JOB_ADDONS_COLUMNS = {
  select: 'id, job_id, addon_type, description, estimated_price_min, estimated_price_max, photo_url, client_informed, status, created_at',
  minimal: 'id, job_id, addon_type, status',
} as const;

// ============================================
// LANDSCAPERS TABLE COLUMNS
// ============================================
export const LANDSCAPERS_COLUMNS = {
  core: [
    'id',
    'user_id',
    'created_at',
  ],
  
  standard: [
    'id',
    'user_id',
    'business_name',
    'approved',
    'insurance_verified',
    'stripe_connect_id',
    'created_at',
    'updated_at',
  ],
  
  extended: [
    'id',
    'user_id',
    'business_name',
    'license_number',
    'insurance_verified',
    'insurance_file',
    'service_radius',
    'hourly_rate',
    'rating',
    'average_rating',
    'total_reviews',
    'completed_jobs_count',
    'reliability_score',
    'is_approved',
    'approved',
    'tier',
    'stripe_connect_id',
    'stripe_account_status',
    'stripe_charges_enabled',
    'stripe_payouts_enabled',
    'stripe_details_submitted',
    'stripe_onboarding_complete',
    'verification_status',
    'payout_enabled',
    'created_at',
    'updated_at',
  ],
  
  // Profile view
  profileView: 'id, user_id, business_name, approved, insurance_verified, tier, completed_jobs_count, average_rating, created_at',
  
  // Stripe Connect view
  stripeView: 'id, user_id, stripe_connect_id, stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, stripe_onboarding_complete',
  
  // Admin view
  adminView: 'id, user_id, business_name, approved, insurance_verified, stripe_connect_id, tier, completed_jobs_count, average_rating, created_at, updated_at',
  
  // Minimal view
  minimal: 'id, user_id, business_name, approved',
} as const;

// ============================================
// PROFILES TABLE COLUMNS
// ============================================
export const PROFILES_COLUMNS = {
  core: [
    'id',
    'user_id',
    'email',
  ],
  
  standard: [
    'id',
    'user_id',
    'email',
    'first_name',
    'last_name',
    'phone',
    'role',
    'created_at',
  ],
  
  extended: [
    'id',
    'user_id',
    'email',
    'first_name',
    'last_name',
    'full_name',
    'phone',
    'address',
    'city',
    'state',
    'zip',
    'role',
    'stripe_customer_id',
    'service_areas',
    'created_at',
    'updated_at',
  ],
  
  // Client profile view
  clientView: 'id, user_id, email, first_name, last_name, phone, address, city, state, zip, stripe_customer_id, created_at',
  
  // Basic info view
  basicView: 'id, user_id, email, first_name, last_name, phone, role',
  
  // Minimal view
  minimal: 'id, user_id, email, role',
} as const;

// ============================================
// NOTIFICATIONS TABLE COLUMNS
// ============================================
export const NOTIFICATIONS_COLUMNS = {
  select: 'id, user_id, type, title, message, data, read, created_at, updated_at',
  minimal: 'id, user_id, type, title, read, created_at',
} as const;

// ============================================
// PAYMENTS TABLE COLUMNS
// ============================================
export const PAYMENTS_COLUMNS = {
  standard: [
    'id',
    'job_id',
    'client_id',
    'landscaper_id',
    'amount',
    'status',
    'created_at',
  ],
  
  select: 'id, job_id, client_id, landscaper_id, stripe_payment_intent_id, amount, platform_fee, landscaper_payout, status, payment_method, currency, description, created_at, updated_at, paid_at',
  
  minimal: 'id, amount, status, created_at',
} as const;

// ============================================
// PAYOUTS TABLE COLUMNS
// ============================================
export const PAYOUTS_COLUMNS = {
  select: 'id, landscaper_id, amount, stripe_transfer_id, status, period_start, period_end, jobs_included, fees_deducted, created_at, updated_at, paid_at',
  minimal: 'id, landscaper_id, amount, status, created_at',
} as const;

// ============================================
// ADMIN_SERVICE_AREAS TABLE COLUMNS
// ============================================
export const ADMIN_SERVICE_AREAS_COLUMNS = {
  select: 'id, area_type, zip_code, city, state, region_name, is_active, priority, max_landscapers, current_landscaper_count, notes, created_at, updated_at',
  minimal: 'id, area_type, zip_code, city, state, is_active',
} as const;

// ============================================
// STRIPE_CONNECT_NOTIFICATIONS TABLE COLUMNS
// ============================================
export const STRIPE_CONNECT_NOTIFICATIONS_COLUMNS = {
  select: 'id, landscaper_id, stripe_connect_id, event_type, status, message, processed, processed_at, notification_sent, created_at',
  minimal: 'id, landscaper_id, event_type, processed, created_at',
} as const;

// ============================================
// NULL-SAFE HELPERS
// ============================================

/**
 * Safely get a value from an object with a fallback
 */
export function safeGet<T>(obj: Record<string, unknown> | null | undefined, key: string, fallback: T): T {
  if (!obj || obj[key] === undefined || obj[key] === null) {
    return fallback;
  }
  return obj[key] as T;
}

/**
 * Safely get a string value
 */
export function safeString(obj: Record<string, unknown> | null | undefined, key: string, fallback = ''): string {
  return safeGet(obj, key, fallback);
}

/**
 * Safely get a number value
 */
export function safeNumber(obj: Record<string, unknown> | null | undefined, key: string, fallback = 0): number {
  const value = safeGet(obj, key, fallback);
  return typeof value === 'number' ? value : Number(value) || fallback;
}

/**
 * Safely get a boolean value
 */
export function safeBoolean(obj: Record<string, unknown> | null | undefined, key: string, fallback = false): boolean {
  return safeGet(obj, key, fallback);
}

/**
 * Safely get a date value
 */
export function safeDate(obj: Record<string, unknown> | null | undefined, key: string): Date | null {
  const value = safeGet(obj, key, null);
  if (!value) return null;
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Safely get an array value
 */
export function safeArray<T>(obj: Record<string, unknown> | null | undefined, key: string, fallback: T[] = []): T[] {
  const value = safeGet(obj, key, fallback);
  return Array.isArray(value) ? value : fallback;
}

// ============================================
// QUERY RESULT NORMALIZERS
// ============================================

/**
 * Normalize a job object to ensure all expected fields exist
 */
export function normalizeJob(job: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!job) return null;
  
  return {
    id: safeString(job, 'id'),
    status: safeString(job, 'status', 'pending'),
    service_type: safeString(job, 'service_type') || safeString(job, 'service_name'),
    service_name: safeString(job, 'service_name') || safeString(job, 'service_type'),
    // Price: use only 'price' column — 'amount' and 'total_amount' do not exist in jobs table
    price: safeNumber(job, 'price'),

    created_at: safeString(job, 'created_at'),
    updated_at: safeString(job, 'updated_at'),
    scheduled_date: safeString(job, 'scheduled_date') || safeString(job, 'preferred_date'),
    completed_at: safeString(job, 'completed_at'),
    client_id: safeString(job, 'client_id'),
    landscaper_id: safeString(job, 'landscaper_id'),
    user_id: safeString(job, 'user_id'),
    client_email: safeString(job, 'client_email'),
    landscaper_email: safeString(job, 'landscaper_email'),
    customer_name: safeString(job, 'customer_name'),
    is_available: safeBoolean(job, 'is_available'),
    assigned_to: safeString(job, 'assigned_to'),
    // Preserve any additional fields
    ...job,
  };
}

/**
 * Normalize a job photo object
 */
export function normalizeJobPhoto(photo: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!photo) return null;
  
  return {
    id: safeString(photo, 'id'),
    job_id: safeString(photo, 'job_id'),
    // Handle both file_url and photo_url
    file_url: safeString(photo, 'file_url') || safeString(photo, 'photo_url'),
    photo_url: safeString(photo, 'photo_url') || safeString(photo, 'file_url'),
    // Handle both type and photo_type
    type: safeString(photo, 'type') || safeString(photo, 'photo_type'),
    photo_type: safeString(photo, 'photo_type') || safeString(photo, 'type'),
    // Handle both uploaded_at and created_at
    uploaded_at: safeString(photo, 'uploaded_at') || safeString(photo, 'created_at'),
    created_at: safeString(photo, 'created_at') || safeString(photo, 'uploaded_at'),
    sort_order: safeNumber(photo, 'sort_order', 0),
    caption: safeString(photo, 'caption'),
    ...photo,
  };
}

/**
 * Normalize a landscaper object
 */
export function normalizeLandscaper(landscaper: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!landscaper) return null;
  
  return {
    id: safeString(landscaper, 'id'),
    user_id: safeString(landscaper, 'user_id'),
    business_name: safeString(landscaper, 'business_name'),
    // Handle both approved and is_approved
    approved: safeBoolean(landscaper, 'approved') || safeBoolean(landscaper, 'is_approved'),
    is_approved: safeBoolean(landscaper, 'is_approved') || safeBoolean(landscaper, 'approved'),
    insurance_verified: safeBoolean(landscaper, 'insurance_verified'),
    tier: safeString(landscaper, 'tier', 'bronze'),
    completed_jobs_count: safeNumber(landscaper, 'completed_jobs_count'),
    // Handle both rating and average_rating
    average_rating: safeNumber(landscaper, 'average_rating') || safeNumber(landscaper, 'rating'),
    rating: safeNumber(landscaper, 'rating') || safeNumber(landscaper, 'average_rating'),
    reliability_score: safeNumber(landscaper, 'reliability_score'),
    stripe_connect_id: safeString(landscaper, 'stripe_connect_id'),
    stripe_account_status: safeString(landscaper, 'stripe_account_status'),
    stripe_charges_enabled: safeBoolean(landscaper, 'stripe_charges_enabled'),
    stripe_payouts_enabled: safeBoolean(landscaper, 'stripe_payouts_enabled'),
    stripe_details_submitted: safeBoolean(landscaper, 'stripe_details_submitted'),
    stripe_onboarding_complete: safeBoolean(landscaper, 'stripe_onboarding_complete'),
    created_at: safeString(landscaper, 'created_at'),
    updated_at: safeString(landscaper, 'updated_at'),
    ...landscaper,
  };
}

/**
 * Normalize a profile object
 */
export function normalizeProfile(profile: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!profile) return null;
  
  return {
    id: safeString(profile, 'id'),
    user_id: safeString(profile, 'user_id'),
    email: safeString(profile, 'email'),
    first_name: safeString(profile, 'first_name'),
    last_name: safeString(profile, 'last_name'),
    full_name: safeString(profile, 'full_name') || 
      `${safeString(profile, 'first_name')} ${safeString(profile, 'last_name')}`.trim(),
    phone: safeString(profile, 'phone'),
    address: safeString(profile, 'address'),
    city: safeString(profile, 'city'),
    state: safeString(profile, 'state'),
    zip: safeString(profile, 'zip'),
    role: safeString(profile, 'role'),
    stripe_customer_id: safeString(profile, 'stripe_customer_id'),
    created_at: safeString(profile, 'created_at'),
    ...profile,
  };
}

/**
 * Normalize a notification object
 */
export function normalizeNotification(notification: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!notification) return null;
  
  return {
    id: safeString(notification, 'id'),
    user_id: safeString(notification, 'user_id'),
    type: safeString(notification, 'type'),
    title: safeString(notification, 'title'),
    message: safeString(notification, 'message'),
    data: notification.data || {},
    read: safeBoolean(notification, 'read'),
    created_at: safeString(notification, 'created_at'),
    updated_at: safeString(notification, 'updated_at'),
    ...notification,
  };
}

/**
 * Normalize a payment object
 */
export function normalizePayment(payment: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!payment) return null;
  
  return {
    id: safeString(payment, 'id'),
    job_id: safeString(payment, 'job_id'),
    client_id: safeString(payment, 'client_id'),
    landscaper_id: safeString(payment, 'landscaper_id'),
    amount: safeNumber(payment, 'amount'),
    platform_fee: safeNumber(payment, 'platform_fee'),
    landscaper_payout: safeNumber(payment, 'landscaper_payout'),
    status: safeString(payment, 'status', 'pending'),
    payment_method: safeString(payment, 'payment_method'),
    currency: safeString(payment, 'currency', 'usd'),
    created_at: safeString(payment, 'created_at'),
    paid_at: safeString(payment, 'paid_at'),
    ...payment,
  };
}

// ============================================
// SAFE QUERY WRAPPER
// ============================================

/**
 * Wrap a Supabase query result with error handling and normalization
 */
export async function safeQuery<T>(
  queryPromise: Promise<{ data: T | null; error: Error | null }>,
  normalizer?: (item: Record<string, unknown>) => Record<string, unknown> | null
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await queryPromise;
    
    if (result.error) {
      console.warn('[safeQuery] Query error:', result.error.message);
      return { data: null, error: result.error };
    }
    
    if (!result.data) {
      return { data: null, error: null };
    }
    
    // Apply normalizer if provided
    if (normalizer) {
      if (Array.isArray(result.data)) {
        const normalizedData = (result.data as Record<string, unknown>[])
          .map(item => normalizer(item))
          .filter(Boolean) as T;
        return { data: normalizedData, error: null };
      } else {
        const normalizedData = normalizer(result.data as Record<string, unknown>) as T;
        return { data: normalizedData, error: null };
      }
    }
    
    return result;
  } catch (err) {
    console.error('[safeQuery] Unexpected error:', err);
    return { data: null, error: err as Error };
  }
}

// ============================================
// TABLE EXISTENCE CHECK
// ============================================

/**
 * Check if a table/column exists by attempting a minimal query
 * Returns true if accessible, false otherwise
 */
export async function checkTableAccess(
  supabase: { from: (table: string) => { select: (columns: string) => { limit: (n: number) => Promise<{ error: Error | null }> } } },
  table: string,
  columns = 'id'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(table)
      .select(columns)
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}
