-- Migration: Add sort_order and uploaded_by columns to job_photos
-- Date: 2026-01-26
-- Purpose: Schema alignment for photo upload flow
--
-- sort_order: Required for photo ordering (before/after sequence)
--             Used in 11 frontend files across 38 occurrences
--
-- uploaded_by: Required for RLS policy compliance
--              Policy users_upload_job_photos requires uploaded_by = auth.uid()

-- Add sort_order column for photo ordering
ALTER TABLE public.job_photos 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add uploaded_by column for RLS policy compliance
ALTER TABLE public.job_photos 
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_job_photos_sort_order 
ON public.job_photos(sort_order);

CREATE INDEX IF NOT EXISTS idx_job_photos_uploaded_by 
ON public.job_photos(uploaded_by);

-- Verification queries (for manual testing):
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'job_photos' AND column_name IN ('sort_order', 'uploaded_by');
