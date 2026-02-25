-- Migration: Drop client_email_must_match_user constraint
-- Date: 2026-01-25
-- Reason: This CHECK constraint was blocking valid admin and landscaper updates
--         during the job lifecycle. Client identity should be enforced at creation
--         time via RLS policies and Edge Functions, not on all updates.

-- Drop the constraint (IF EXISTS for idempotency)
ALTER TABLE jobs
DROP CONSTRAINT IF EXISTS client_email_must_match_user;

-- Note: Job access control is now enforced via:
-- 1. RLS policies on the jobs table
-- 2. Service-role Edge Functions for admin operations
-- 3. The jobs_landscaper_accept_available policy for landscaper job acceptance
