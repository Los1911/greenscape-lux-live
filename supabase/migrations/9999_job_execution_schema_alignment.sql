-- Job Execution Schema Alignment Migration
-- Aligns schema with frontend code usage and V1 job execution flow
-- Created: 2026-01-25

-- 1. Add started_at column to jobs table (aligns with frontend code)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_jobs_started_at ON jobs(started_at);

-- 2. Update status CHECK constraint to include completed_pending_review
-- First drop existing constraint if any
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- Add comprehensive constraint with all valid status values
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
CHECK (status IN (
  'pending',           -- Initial job request
  'quoted',            -- Quote provided
  'accepted',          -- Quote accepted by client
  'assigned',          -- Assigned to landscaper
  'available',         -- Available for landscapers to claim
  'scheduled',         -- Scheduled for specific date
  'in_progress',       -- Work has started
  'completed_pending_review',  -- NEW: Work done, awaiting admin review
  'completed',         -- Fully completed and approved
  'cancelled'          -- Job cancelled
));

-- Note: GPS geofencing edge function (process-geofence-event) has been updated to:
-- - Use 'started_at' instead of 'actual_start_time' on entry
-- - Use 'completed_pending_review' instead of 'completed' on exit
-- This ensures admin review is required before final job completion
