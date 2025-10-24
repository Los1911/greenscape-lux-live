# Database Schema Fixes

## Migration: 9999_fix_landscaper_jobs_schema.sql

This migration adds missing columns that the app queries but may not exist in the current schema.

### How to Apply

**Option 1: Supabase SQL Editor**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `9999_fix_landscaper_jobs_schema.sql`
4. Execute the SQL

**Option 2: CLI Migration**
```bash
supabase db push
```

### Important Notes

- If your jobs table uses a different date column than `scheduled_at` (e.g., `date`, `appointment_time`), either:
  - Rename that column to `scheduled_at`, OR  
  - Update the dashboard queries to use your actual column name
- The migration uses `add column if not exists` so it's safe to run multiple times
- The auth_user_id backfill attempts to link existing landscapers to auth.users by email