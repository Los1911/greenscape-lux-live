-- V1 Payout Readiness Schema Migration
-- Add payout tracking columns to jobs table for admin-controlled payouts
-- Created: 2026-01-25

-- Add payout_status column with default 'not_ready'
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'not_ready';

-- Add payout_amount column (landscaper's share)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS payout_amount NUMERIC(10,2);

-- Add payout release tracking columns
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS payout_released_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS payout_released_by UUID REFERENCES auth.users(id);

-- Add CHECK constraint for payout_status values
-- not_ready: Job not yet completed or payment not received
-- pending: Job completed, payment received, awaiting admin review
-- ready: Marked ready for payout by admin
-- held: Admin has placed a hold on payout
-- paid: Payout has been released
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_payout_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_payout_status_check 
CHECK (payout_status IN ('not_ready', 'pending', 'ready', 'held', 'paid'));

-- Create indexes for payout queue queries
CREATE INDEX IF NOT EXISTS idx_jobs_payout_status ON public.jobs(payout_status);
CREATE INDEX IF NOT EXISTS idx_jobs_payout_ready ON public.jobs(status, payout_status) 
WHERE status = 'completed' AND payout_status IN ('ready', 'pending');

-- Add comments for documentation
COMMENT ON COLUMN public.jobs.payout_status IS 'Payout eligibility status: not_ready, pending, ready, held, paid';
COMMENT ON COLUMN public.jobs.payout_amount IS 'Amount to be paid to landscaper (after platform fees)';
COMMENT ON COLUMN public.jobs.payout_released_at IS 'Timestamp when payout was released by admin';
COMMENT ON COLUMN public.jobs.payout_released_by IS 'Admin user who released the payout';
