-- ============================================
-- DATABASE PERFORMANCE OPTIMIZATION MIGRATION
-- ============================================
-- Adds strategic indexes, query optimization, and performance improvements
-- for frequently queried columns and complex joins

-- ============================================
-- STRATEGIC INDEXES FOR HIGH-TRAFFIC QUERIES
-- ============================================

-- Users table performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_role_status 
ON public.users(email, role, status) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_auth_lookup 
ON public.users(id, email, role) WHERE status = 'active';

-- Jobs table compound indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_client_status_date 
ON public.jobs(client_id, status, preferred_date) 
WHERE status IN ('pending', 'assigned', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_landscaper_active 
ON public.jobs(landscaper_id, status, created_at DESC) 
WHERE landscaper_id IS NOT NULL AND status != 'cancelled';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location_search 
ON public.jobs(property_city, property_state, service_type, status) 
WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_budget_range 
ON public.jobs(service_type, budget_min, budget_max, status) 
WHERE status = 'pending' AND budget_min IS NOT NULL;

-- Payments table performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_landscaper_earnings 
ON public.payments(landscaper_id, status, created_at DESC) 
WHERE status = 'succeeded';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_client_history 
ON public.payments(customer_id, status, created_at DESC) 
WHERE status IN ('succeeded', 'processing');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_payout_pending 
ON public.payments(landscaper_id, payout_status, created_at) 
WHERE payout_status = 'pending';

-- Communications table for messaging performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_recent_messages 
ON public.communications(job_id, created_at DESC, read_at) 
WHERE created_at > NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_unread_count 
ON public.communications(job_id, sender_id) 
WHERE read_at IS NULL;

-- Notifications table for real-time updates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, read, created_at DESC) 
WHERE read = false;

-- Reviews table for rating calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_landscaper_rating 
ON public.reviews(landscaper_id, rating, created_at DESC) 
WHERE rating IS NOT NULL;

-- Job photos for gallery queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_photos_type_date 
ON public.job_photos(job_id, photo_type, created_at DESC);

-- ============================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- ============================================

-- Active landscapers only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_landscapers_active_approved 
ON public.landscapers(approved, rating DESC, created_at DESC) 
WHERE approved = true AND email IS NOT NULL;

-- Recent job assignments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_assignments_recent 
ON public.job_assignments(landscaper_id, status, assigned_at DESC) 
WHERE assigned_at > NOW() - INTERVAL '90 days';

-- Failed payments for retry processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_failed_retry 
ON public.payments(status, created_at, retry_count) 
WHERE status = 'failed' AND retry_count < 3;

-- ============================================
-- COVERING INDEXES FOR COMMON QUERIES
-- ============================================

-- Job listing with all needed fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_listing_complete 
ON public.jobs(status, service_type, property_city, property_state) 
INCLUDE (id, title, description, budget_min, budget_max, preferred_date, created_at);

-- User profile lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_profile_lookup 
ON public.users(email) 
INCLUDE (id, role, first_name, last_name, status, created_at);

-- Landscaper search results
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_landscapers_search 
ON public.landscapers(approved, rating DESC) 
INCLUDE (id, business_name, hourly_rate, service_radius, total_reviews);

-- ============================================
-- EXPRESSION INDEXES FOR SEARCH
-- ============================================

-- Case-insensitive email search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower 
ON public.users(LOWER(email)) WHERE status = 'active';

-- Full-text search for job descriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_search_text 
ON public.jobs USING gin(to_tsvector('english', title || ' ' || description)) 
WHERE status = 'pending';

-- Business name search for landscapers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_landscapers_business_search 
ON public.landscapers USING gin(to_tsvector('english', business_name)) 
WHERE approved = true;

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

ANALYZE public.users;
ANALYZE public.clients;
ANALYZE public.landscapers;
ANALYZE public.jobs;
ANALYZE public.quotes;
ANALYZE public.payments;
ANALYZE public.reviews;
ANALYZE public.communications;
ANALYZE public.notifications;
ANALYZE public.job_photos;
ANALYZE public.job_assignments;

-- ============================================
-- VACUUM AND REINDEX MAINTENANCE
-- ============================================

-- Update table statistics
UPDATE pg_stat_user_tables SET n_tup_ins = n_tup_ins WHERE schemaname = 'public';

-- ============================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================

-- Create view for slow queries monitoring
CREATE OR REPLACE VIEW performance_slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- Create view for index usage monitoring
CREATE OR REPLACE VIEW performance_index_usage AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  CASE 
    WHEN idx_scan = 0 THEN 'Never Used'
    WHEN idx_scan < 10 THEN 'Rarely Used'
    ELSE 'Actively Used'
  END as usage_status
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_users_email_role_status IS 'Optimizes user authentication and role-based queries';
COMMENT ON INDEX idx_jobs_client_status_date IS 'Optimizes client job dashboard queries';
COMMENT ON INDEX idx_jobs_landscaper_active IS 'Optimizes landscaper job assignment queries';
COMMENT ON INDEX idx_payments_landscaper_earnings IS 'Optimizes landscaper earnings calculations';
COMMENT ON INDEX idx_communications_recent_messages IS 'Optimizes real-time messaging queries';
COMMENT ON INDEX idx_notifications_user_unread IS 'Optimizes notification badge counts';
COMMENT ON INDEX idx_reviews_landscaper_rating IS 'Optimizes landscaper rating calculations';

-- ============================================
-- PERFORMANCE RECOMMENDATIONS
-- ============================================

-- Log performance optimization completion
INSERT INTO public.admin_audit_logs (
  admin_user_id,
  action,
  details,
  ip_address
) VALUES (
  (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
  'database_optimization',
  'Applied comprehensive database performance optimization with strategic indexes',
  '127.0.0.1'
);