# Landing Page Database View

## Purpose
This view (`landscapers_v`) normalizes the mismatch between `user_id` and `auth_user_id` columns in the landscapers table.

## Setup
Run this SQL in your Supabase SQL Editor:
```sql
-- See 9999_view_landscapers_v.sql
```

## Usage
- Replace queries from `public.landscapers` with `public.landscapers_v`
- Use `auth_user_id_resolved` column for auth user lookups
- This provides backward compatibility while the schema is being standardized

## Future
If you later standardize the schema (auth_user_id everywhere), you can:
1. Drop this view
2. Update all queries to use the standard column name