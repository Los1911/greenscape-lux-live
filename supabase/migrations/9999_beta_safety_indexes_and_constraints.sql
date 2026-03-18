-- ============================================================
-- BETA SAFETY MIGRATION: Indexes & Status Constraints
-- Applied: 2026-03-13
-- Purpose: Backend safeguards for 10-job private beta
-- ============================================================

-- 1. payment_status index for admin dashboard lifecycle queries
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status
ON jobs(payment_status);

-- 2. Composite index for lifecycle dashboard (status + payment_status)
CREATE INDEX IF NOT EXISTS idx_jobs_status_payment_status
ON jobs(status, payment_status);

-- 3. payout_status index for payout lifecycle queries
CREATE INDEX IF NOT EXISTS idx_jobs_payout_status
ON jobs(payout_status);

-- 4. Verify job_status enum contains all required lifecycle states:
--    pending, priced, scheduled, assigned, active,
--    completed_pending_review, completed, cancelled
-- VERIFIED: All 8 required states present in job_status enum.
-- Additional states also present: quoted, available, pending_review,
--    flagged_review, blocked, rescheduled, completion_flagged

-- 5. CHECK constraint on payment_status to prevent invalid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'jobs'::regclass
    AND conname = 'jobs_payment_status_check'
  ) THEN
    ALTER TABLE jobs ADD CONSTRAINT jobs_payment_status_check
    CHECK (
      payment_status IS NULL
      OR payment_status IN (
        'unpaid', 'pending', 'processing', 'paid',
        'failed', 'refunded', 'cancelled'
      )
    );
  END IF;
END $$;

-- 6. CHECK constraint on payout_status to prevent invalid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'jobs'::regclass
    AND conname = 'jobs_payout_status_check'
  ) THEN
    ALTER TABLE jobs ADD CONSTRAINT jobs_payout_status_check
    CHECK (
      payout_status IS NULL
      OR payout_status IN (
        'unpaid', 'not_ready', 'pending_review', 'ready',
        'ready_for_release', 'processing', 'paid', 'released',
        'failed', 'disputed'
      )
    );
  END IF;
END $$;
