# ONBOARDING LOOP FIX - FINAL RESOLUTION

## Date: January 5, 2026

## ROOT CAUSE IDENTIFIED

The onboarding loop was caused by a **missing profiles row** scenario:

1. **OnboardingGuard** queries `profiles` table with `.maybeSingle()`
2. If no row exists for the user, `profile` is `null`
3. When `profile` is `null`, ALL completion checks fail:
   ```typescript
   const hasFirstName = !!(profile?.first_name && profile.first_name.trim());
   // Returns false when profile is null
   ```
4. The modals used `.update()` which **fails silently** when no row exists (affects 0 rows)
5. User sees "Saved" success message, but database has no data
6. Guard re-evaluates, finds nothing, loops back to onboarding

## SURGICAL FIX APPLIED

### 1. OnboardingGuard - Guarantee Profile Row Exists

**File:** `src/components/onboarding/OnboardingGuard.tsx`

**Change:** Added `ensureProfileExists()` function that:
- Checks if profile row exists for user
- If not, creates a minimal row: `{ id: user.id, email, role: 'client' }`
- Handles race conditions (duplicate key errors)
- Only THEN proceeds to evaluate completion

```typescript
const ensureProfileExists = async (userId: string, userEmail: string | undefined): Promise<boolean> => {
  // Check if exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfile) return true;

  // Create minimal row
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({ id: userId, email: userEmail, role: 'client' });

  // Handle race condition
  if (insertError?.code === '23505') return true;
  
  return !insertError;
};
```

### 2. ServiceAddressModal - Use Upsert

**File:** `src/components/client/ServiceAddressModal.tsx`

**Change:** Replaced `.update()` with `.upsert()`:

```typescript
// BEFORE (fails silently if no row)
const { error } = await supabase
  .from('profiles')
  .update(addressData)
  .eq('id', user.id);

// AFTER (always succeeds)
const { error } = await supabase
  .from('profiles')
  .upsert({ id: user.id, ...addressData }, { onConflict: 'id' });
```

### 3. EnhancedProfileEditForm - Use Upsert

**File:** `src/components/client/EnhancedProfileEditForm.tsx`

**Change:** Same pattern - replaced `.update()` with `.upsert()`:

```typescript
const { error } = await supabase
  .from('profiles')
  .upsert({ id: user.id, ...profileData }, { onConflict: 'id' });
```

## WHY THIS FIX WORKS

1. **Profile row is GUARANTEED** before any completion evaluation
2. **Saves ALWAYS succeed** because upsert creates or updates
3. **No timing issues** - database is source of truth
4. **No UI changes** - same user experience
5. **No delays or retries** - deterministic behavior

## DECISION FLOW (UNCHANGED)

```
User authenticates
       ↓
OnboardingGuard mounts
       ↓
ensureProfileExists() ← NEW: Creates row if missing
       ↓
Fetch profile from database
       ↓
Evaluate completion:
  - hasFirstName && hasLastName && hasPhone
  - hasStreet && hasCity && hasState && hasZip
       ↓
isComplete = personalComplete && addressComplete
       ↓
isComplete ? Dashboard : Onboarding
```

## WHAT WAS NOT CHANGED

- ❌ No delays added
- ❌ No localStorage/session flags
- ❌ No event-driven logic
- ❌ No UI redesign
- ❌ No new tables
- ❌ No copy changes

## TESTING CHECKLIST

1. [ ] New user signup → profile row created automatically
2. [ ] Personal info save → data persists in database
3. [ ] Address save → data persists in database
4. [ ] Complete both steps → redirects to dashboard
5. [ ] Refresh after completion → stays on dashboard
6. [ ] Clear localStorage → still works (database is source of truth)

## CONSOLE LOGS TO VERIFY

When working correctly, you should see:
```
[ONBOARDING_GUARD] Starting onboarding check for user: <uuid>
[ONBOARDING_GUARD] Ensuring profile row exists for user: <uuid>
[ONBOARDING_GUARD] Profile row already exists (or) Profile row created successfully
[ONBOARDING_GUARD] Fetching profile from database
[ONBOARDING_GUARD] Database evaluation result: { hasFirstName: true, ... isComplete: true }
[ONBOARDING_GUARD] Onboarding complete - rendering dashboard
```

## FILES MODIFIED

1. `src/components/onboarding/OnboardingGuard.tsx` - Added ensureProfileExists()
2. `src/components/client/ServiceAddressModal.tsx` - Changed update to upsert
3. `src/components/client/EnhancedProfileEditForm.tsx` - Changed update to upsert
