# Admin Routing Audit Report

**Issue**: Admin logs in → clicks "Get Started" → routed to client onboarding instead of admin dashboard.

**Date**: 2026-03-01

---

## 1. Files Involved

| # | File | Role in Bug |
|---|------|-------------|
| 1 | `src/components/Hero.tsx` | **Entry point** — "Get Started" button navigates to `/get-started` (line 41) |
| 2 | `src/App.tsx` | **Route mapping** — `/get-started` → `<RoleRouter />` (line 139) |
| 3 | `src/router/RoleRouter.tsx` | **PRIMARY ROOT CAUSE** — 1.5s timeout defaults to `/client-dashboard` when role is null (lines 40–48) |
| 4 | `src/components/auth/SimpleProtectedRoute.tsx` | **SECONDARY** — own 1.5s timeout allows children to render before role resolves (lines 47–55, 91–100) |
| 5 | `src/pages/ClientDashboardV2.tsx` | **TERTIARY** — wraps content in `<OnboardingGuard>` (line 216); admin redirect at line 56–58 only fires if role is resolved |
| 6 | `src/components/onboarding/OnboardingGuard.tsx` | **TERMINAL SYMPTOM** — shows onboarding when `role` is null because bypass check requires `role && role !== 'client'` (line 155) |
| 7 | `src/contexts/AuthContext.tsx` | **TIMING SOURCE** — role resolution is async (2+ DB queries); exposes `roleResolved` flag but downstream components don't use it |

---

## 2. Exact Lines Responsible

### PRIMARY: `src/router/RoleRouter.tsx` — Lines 40–48

```tsx
// CASE 2: User exists but role not loaded yet → wait with timeout
if (!role) {
  if (!waitingForRole) {
    setWaitingForRole(true);
    // 1.5-second timeout for fast recovery
    roleTimeoutRef.current = setTimeout(() => {
      if (!hasRedirected.current) {
        console.warn('[RoleRouter] Role timeout - defaulting to client dashboard');
        hasRedirected.current = true;
        navigate('/client-dashboard', { replace: true });  // ← BUG: hardcoded client fallback
      }
    }, 1500);  // ← BUG: too short for cold-start DB queries
  }
  return;
}
```

**Problem**: When role resolution takes >1.5s (common on cold Supabase connections), ALL users — including admins — are sent to `/client-dashboard`.

### SECONDARY: `src/components/onboarding/OnboardingGuard.tsx` — Lines 155–166

```tsx
// Only apply onboarding to clients
if (role && role !== 'client') {
  log(`User is ${role}, not client - skipping onboarding`);
  // ... sets status to 'complete'
}
```

**Problem**: When `role` is `null` (not yet resolved), this bypass is skipped. The guard then checks the admin's profile for client onboarding fields (first_name, last_name, phone, address, city, state, zip). If any are missing, it shows the onboarding screen.

### TERTIARY: `src/components/onboarding/OnboardingGuard.tsx` — Line 61

```tsx
const { user, session, loading: authLoading, role } = useAuth();
```

**Problem**: Does NOT destructure `roleResolved` from AuthContext. Cannot distinguish between "role is null because it hasn't loaded" vs "role is null because user has no role."

---

## 3. Complete Bug Timeline

```
T+0.0s  Admin clicks "Get Started" → navigate('/get-started')
T+0.0s  App.tsx renders <RoleRouter />
T+0.0s  RoleRouter: loading=false, user=exists, role=null → starts 1.5s timeout
T+0.0s  AuthContext: processSession running, querying landscapers + profiles tables
T+1.5s  RoleRouter TIMEOUT FIRES: role still null → navigate('/client-dashboard')  ← BUG
T+1.5s  SimpleProtectedRoute (requiredRole="client"): role=null → starts 1.5s timeout
T+2.0s  AuthContext: role resolves to 'admin' → sets roleResolved=true
T+2.0s  SimpleProtectedRoute: detects role mismatch (admin ≠ client)
T+2.0s  SimpleProtectedRoute: fires dashboardRouter.navigateToRoleDashboard() (async)
T+2.0s  BUT: OnboardingGuard already rendered, already fetched profile, already showing onboarding
T+3.0s  SimpleProtectedRoute timeout fires → children already rendered
        Result: Admin sees client onboarding screen
```

**Key insight**: The race condition window is ~0.5–1.5s between RoleRouter's timeout and AuthContext's role resolution. On slow connections, this window widens.

---

## 4. Post-Login Redirect Handling

| Component | Redirect Logic | Issue |
|-----------|---------------|-------|
| `RoleRouter` (line 60–68) | `admin → /admin`, `landscaper → /landscaper-dashboard`, `client → /client-dashboard` | Correct when role is resolved; broken on timeout |
| `SimpleProtectedRoute` (line 58–63) | Role mismatch → `dashboardRouter.navigateToRoleDashboard()` | Async, can lose race to OnboardingGuard render |
| `ClientDashboardV2` (line 56–58) | `role === 'admin' → /admin-dashboard` | Only fires if role is resolved before render |
| `OnboardingGuard` (line 155) | `role && role !== 'client' → bypass` | Fails when role is null |

---

## 5. Onboarding Guard Trigger Analysis

The OnboardingGuard is triggered at:
- `src/pages/ClientDashboardV2.tsx` line 216: `<OnboardingGuard onComplete={...}>`

It is **NOT** triggered for admin routes (`/admin`, `/admin-dashboard`). The problem is the admin never reaches those routes — they're sent to `/client-dashboard` by the RoleRouter timeout.

---

## 6. Role Resolution Timing

`AuthContext.tsx` exposes `roleResolved: boolean` (line 37, 415) which is set to `true` only after the full role resolution chain completes. However:

- **RoleRouter** does NOT use `roleResolved` — it only checks `role` (line 23)
- **OnboardingGuard** does NOT use `roleResolved` — it only checks `role` (line 61)
- **SimpleProtectedRoute** does NOT use `roleResolved`

Only `UnifiedPortalAuth.tsx` correctly uses `roleResolved` (line 86: `if (!roleResolved) return;`).

---

## 7. Does "/" Redirect to Onboarding?

**No.** `App.tsx` line 132: `<Route path="/" element={<GreenScapeLuxLanding />} />` renders the landing page. The onboarding is only reached via the chain: `/get-started` → RoleRouter timeout → `/client-dashboard` → OnboardingGuard.

---

## 8. Recommended Minimal Fix

### Fix A — `src/router/RoleRouter.tsx` (PRIMARY)

1. Destructure `roleResolved` from `useAuth()`
2. Wait for `roleResolved === true` before redirecting (not just `role !== null`)
3. In timeout fallback: check `sessionStorage.getItem('user_role')` for cached role
4. If cached role is 'admin' → navigate to `/admin`; if 'landscaper' → `/landscaper-dashboard`
5. Only default to `/client-dashboard` if no cached role exists
6. Increase timeout from 1.5s → 3s

### Fix B — `src/components/onboarding/OnboardingGuard.tsx` (BELT-AND-SUSPENDERS)

1. Destructure `roleResolved` from `useAuth()`
2. If `!roleResolved` → stay in loading state (do NOT proceed to profile check)
3. Once `roleResolved === true` and `role !== 'client'` → bypass onboarding immediately
4. This ensures even if an admin somehow reaches OnboardingGuard, they're never shown onboarding

---

## 9. Risk Assessment

| Fix | Risk Level | Blast Radius | Notes |
|-----|-----------|--------------|-------|
| Fix A (RoleRouter) | **Low** | RoleRouter only | Uses existing `roleResolved` flag; cached role is already written by AuthContext; timeout increase is conservative |
| Fix B (OnboardingGuard) | **Low** | Client onboarding flow | Only adds a wait-for-role-resolved gate; existing `role !== 'client'` bypass is preserved; no schema changes |
| Combined | **Low** | Isolated to routing | No database changes, no Stripe changes, no RLS changes, no lifecycle changes |

**Production safety**: Both fixes are additive guards. They cannot break existing flows because:
- Fix A: If `roleResolved` is true and role is correct, behavior is identical to current code
- Fix B: If role resolves to 'client', onboarding flow is unchanged
- Worst case on regression: slightly longer loading spinner (3s vs 1.5s)

---

## 10. Files NOT Modified

Per requirements, the following are untouched:
- Database schema / migrations
- Stripe configuration
- RLS policies
- Payment lifecycle
- All other routing (client, landscaper, marketing pages)
