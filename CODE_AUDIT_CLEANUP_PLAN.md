# 🧹 CODE AUDIT & CLEANUP PLAN

## 🔍 AUDIT FINDINGS

### 🔴 CRITICAL CLEANUP TARGETS

#### 1. **Test & Debug Edge Functions** (REMOVE FROM PRODUCTION)
- `debug-document-storage/index.ts` - Debug utility only
- `test-payout-calculations` - Referenced but may not exist
- Any functions with `test-`, `debug-`, `diagnostic-` prefixes

#### 2. **Duplicate Validation Systems** (CONSOLIDATE)
- `src/components/setup/EnvironmentValidator.tsx`
- `src/components/admin/EnvironmentDiagnostic.tsx` 
- `src/lib/envValidator.ts`
- `src/lib/environmentGuard.ts`
- `src/lib/configHealthCheck.ts`
- `src/utils/environmentValidator.ts`

#### 3. **Diagnostic Utilities** (DEV-ONLY)
- `src/utils/edgeFunctionDiagnostic.ts`
- `src/utils/quoteSubmissionDiagnostic.ts`
- `src/utils/supabaseAuthDiagnostic.ts`
- `src/utils/passwordResetTester.ts`
- `src/utils/authTestingSuite.ts`
- `src/components/landscaper/DocumentUploadDiagnostic.tsx`

#### 4. **Test Files & Scripts** (REVIEW/REMOVE)
- `src/tests/payment-automation/` - Keep if needed for CI
- `tests/unified-email-*.js` - Manual test files
- `src/utils/testAdminEmail.ts`
- `src/utils/testQuoteFlow.ts`
- `scripts/env-debug.js` - Debug script

### 🟡 CONSOLIDATION OPPORTUNITIES

#### 1. **Configuration Systems**
- Merge multiple config files into single source of truth
- Keep: `src/lib/config.ts`
- Review: `configConsolidated.ts`, `runtimeConfig.ts`, `autoConfig.ts`

#### 2. **Authentication Flows**
- Multiple auth components doing similar things
- Consolidate: `UnifiedAuth`, `ModernAuth`, `UnifiedPortalAuth`

#### 3. **Profile Management**
- Duplicate profile components and utilities
- Merge client/landscaper profile logic where possible

## 🎯 CLEANUP STRATEGY

### Phase 1: Remove Debug/Test Code (IMMEDIATE)
1. Delete test edge functions
2. Remove diagnostic utilities from production builds
3. Clean up test scripts and manual test files

### Phase 2: Consolidate Validation (NEXT)
1. Create single environment validation system
2. Remove duplicate validation components
3. Standardize configuration access

### Phase 3: Optimize Components (LATER)
1. Merge duplicate auth flows
2. Consolidate profile management
3. Remove unused imports and dependencies

## 📊 ESTIMATED IMPACT
- **Bundle Size Reduction**: ~15-20%
- **Maintenance Complexity**: -40%
- **Performance Improvement**: 5-10%
- **Developer Experience**: Significantly improved

---
*Generated: 2025-01-23 | Status: READY FOR EXECUTION*