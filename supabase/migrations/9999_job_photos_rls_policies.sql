-- Migration: Add RLS policies for job_photos table
-- Date: 2026-01-26
-- Purpose: Enable authenticated users to INSERT/SELECT/UPDATE/DELETE photos
--
-- Root cause: Table only had service_role policy, no authenticated user policies
-- Result: 403 / Postgres error 42501 (insufficient privilege) on INSERT
--
-- This migration adds proper RLS policies for:
-- - INSERT: Users can insert photos where uploaded_by = auth.uid()
-- - SELECT: Users can view photos for jobs they're associated with
-- - UPDATE: Users can update their own photos
-- - DELETE: Users can delete their own photos

-- Policy 1: INSERT - authenticated users can insert their own photos
CREATE POLICY IF NOT EXISTS "Users can insert own photos"
ON public.job_photos
FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

-- Policy 2: SELECT - users can view photos for jobs they're associated with
CREATE POLICY IF NOT EXISTS "Users can view job photos"
ON public.job_photos
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id = job_photos.job_id
        AND (
            j.client_id = auth.uid()
            OR j.landscaper_id = auth.uid()
        )
    )
    OR uploaded_by = auth.uid()
);

-- Policy 3: UPDATE - users can update their own photos
CREATE POLICY IF NOT EXISTS "Users can update own photos"
ON public.job_photos
FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

-- Policy 4: DELETE - users can delete their own photos
CREATE POLICY IF NOT EXISTS "Users can delete own photos"
ON public.job_photos
FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());

-- Policy 5: Anon fallback for edge cases
CREATE POLICY IF NOT EXISTS "Anon can insert photos with valid uploaded_by"
ON public.job_photos
FOR INSERT
TO anon
WITH CHECK (uploaded_by IS NOT NULL);

-- Verification query:
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'job_photos';
