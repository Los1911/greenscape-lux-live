# ID/UUID Consistency Audit Report

**Generated:** 2024-01-15T10:30:00.000Z

## Summary

- **R1 (React Keys):** 15 violations
- **R2 (Supabase Selects):** 8 violations  
- **R3 (Fabricated IDs):** 0 violations
- **R4 (ID Equality):** 9 violations
- **R5 (ID Shadowing):** 0 violations
- **Total:** 32 violations

## Detailed Findings

### R1 Violations

**src/components/AnimatedBackground.tsx:9**
```typescript
key={i}
```
*React key using array index instead of entity.id*
**Suggestion:** Use key={item.id} instead of array index

**src/components/EarningsCard.tsx:75**
```typescript
key={index}
```
*React key using array index instead of entity.id*
**Suggestion:** Use key={item.id} instead of array index

**src/components/HowItWorks.tsx:32**
```typescript
key={index}
```
*React key using array index instead of entity.id*
**Suggestion:** Use key={item.id} instead of array index

**src/components/LuxuryServices.tsx:45**
```typescript
key={index}
```
*React key using array index instead of entity.id*
**Suggestion:** Use key={item.id} instead of array index

**src/components/admin/EarningsBreakdownCard.tsx:68**
```typescript
key={index}
```
*React key using array index instead of entity.id*
**Suggestion:** Use key={item.id} instead of array index

### R2 Violations

**src/components/landscaper/ProfileCard.tsx:37**
```typescript
.select('insurance_status,insurance_expiry')
```
*Supabase select missing id field*
**Suggestion:** Include id in select statement

**src/components/landscaper/ProfileCard.tsx:52**
```typescript
.select('file_type,status')
```
*Supabase select missing id field*
**Suggestion:** Include id in select statement

**src/components/landscaper/EarningsTrend.tsx:26**
```typescript
.select('id')
```
*Supabase select missing id field*
**Suggestion:** Include id in select statement

**src/components/landscaper/EarningsTrend.tsx:64**
```typescript
.select('completed_at, price')
```
*Supabase select missing id field*
**Suggestion:** Include id in select statement

### R4 Violations

**src/components/JobCompletionForm.tsx:63**
```typescript
.eq('id', jobId);
```
*ID equality check without UUID validation*
**Suggestion:** Validate with isUUID() or ensure variable is named id

**src/components/admin/AdminJobManager.tsx:55**
```typescript
.eq('id', jobId);
```
*ID equality check without UUID validation*
**Suggestion:** Validate with isUUID() or ensure variable is named id

**src/components/admin/AdminJobManager.tsx:71**
```typescript
.eq('id', jobId);
```
*ID equality check without UUID validation*
**Suggestion:** Validate with isUUID() or ensure variable is named id

**src/components/landscaper/LandscaperUpcomingJobs.tsx:77**
```typescript
.eq('id', jobId)
```
*ID equality check without UUID validation*
**Suggestion:** Validate with isUUID() or ensure variable is named id

**src/components/landscaper/ProfileCard.tsx:38**
```typescript
.eq('id', user.id)
```
*ID equality check without UUID validation*
**Suggestion:** Validate with isUUID() or ensure variable is named id

**src/db/contracts.ts:31**
```typescript
.eq('id', id);
```
*ID equality check without UUID validation*
**Suggestion:** Validate with isUUID() or ensure variable is named id

**src/db/contracts.ts:36**
```typescript
.eq('id', id);
```
*ID equality check without UUID validation*
**Suggestion:** Validate with isUUID() or ensure variable is named id

**src/lib/landscapers.ts:23**
```typescript
.eq('id', id)
```
*ID equality check without UUID validation*
**Suggestion:** Validate with isUUID() or ensure variable is named id

**src/pages/LandscaperDashboard.tsx:153**
```typescript
.eq('id', jobId)
```
*ID equality check without UUID validation*
**Suggestion:** Validate with isUUID() or ensure variable is named id