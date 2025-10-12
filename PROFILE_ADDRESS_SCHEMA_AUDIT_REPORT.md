# Profile Address Schema Audit Report

## 🔍 ISSUE IDENTIFIED: Schema Mismatch

### ❌ Root Cause
The frontend code is trying to query the `profiles` table for columns that **DO NOT EXIST**:
- `first_name` ❌ 
- `last_name` ❌
- `phone` ❌
- `address` ❌

### 📊 Current Database Schema Analysis

#### `profiles` Table (Current Schema):
```sql
- id (uuid, NOT NULL)
- email (text, nullable)
- full_name (text, nullable)
- avatar_url (text, nullable)
- role (text, nullable)
- created_at (timestamp with time zone, nullable)
- updated_at (timestamp with time zone, nullable)
```

#### Where These Columns Actually Exist:
- `first_name`, `last_name`, `phone` → `users` table ✅
- `first_name`, `last_name`, `phone` → `clients` table ✅
- `first_name`, `last_name`, `phone` → `landscapers` table ✅
- `address` → `users` table as `street_address` ✅

### 🚨 Failing Frontend Code Locations:

1. **UnifiedProfileManager.tsx** (Line 42):
```typescript
.select('first_name, last_name, phone, address')
```

2. **ProfileEditForm.tsx** (Lines 42-45):
```typescript
.update({
  first_name: formData.firstName,
  last_name: formData.lastName,
  phone: formData.phone,
  address: formData.address,
})
```

## 🔧 SOLUTION OPTIONS

### Option 1: Fix Frontend to Use Correct Tables
- Query `users` table instead of `profiles`
- Map `street_address` to `address`

### Option 2: Apply Missing Migration
- Run the existing migration: `9999_add_address_to_profiles.sql`
- Add missing columns to `profiles` table

### Option 3: Create Database View
- Create unified view combining `profiles` and `users` data

## ⚡ RECOMMENDED IMMEDIATE FIX

**Apply the existing migration** to add missing columns to `profiles` table:

```sql
-- Add missing columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text;
```

This approach:
- ✅ Requires no frontend code changes
- ✅ Maintains data consistency
- ✅ Zero downtime deployment
- ✅ Safe to run multiple times

## 🎯 NEXT STEPS

1. **IMMEDIATE**: Run the column addition migration
2. **VERIFY**: Test profile editing functionality
3. **OPTIONAL**: Migrate existing data from `users` table to `profiles`
4. **MONITOR**: Check for any remaining 400 errors

## 📝 Migration Status
- Migration file exists: ✅ `supabase/migrations/9999_add_address_to_profiles.sql`
- Applied to database: ❌ **NOT APPLIED**
- Frontend expects columns: ✅ Code ready for columns