# Automated Payout System Implementation

## Overview
Comprehensive automated payout system that monitors completed jobs and automatically initiates Stripe payouts to landscapers based on configurable schedules.

## Database Schema

### Tables Created/Enhanced

#### 1. `payouts` Table
Tracks all payout transactions:
- `id` - UUID primary key
- `landscaper_id` - Reference to landscaper
- `stripe_payout_id` - Stripe payout ID
- `amount` - Payout amount (decimal)
- `currency` - Currency code (default: 'usd')
- `status` - Payout status (pending, processing, paid, failed, cancelled)
- `job_ids` - Array of job IDs included in payout
- `payout_date` - When payout was initiated
- `arrival_date` - Expected arrival date
- `failure_code` - Stripe failure code (if failed)
- `failure_message` - Error message (if failed)
- `metadata` - Additional JSON data
- `created_at`, `updated_at` - Timestamps

#### 2. `payout_schedules` Table
Configures payout preferences per landscaper:
- `id` - UUID primary key
- `landscaper_id` - Reference to landscaper (unique)
- `schedule_type` - Frequency (daily, weekly, monthly, manual)
- `minimum_payout` - Minimum amount before payout (default: $50)
- `payout_day` - Day of week (0-6) or month (1-31)
- `auto_payout_enabled` - Enable automatic payouts (boolean)
- `last_payout_date` - Last payout timestamp
- `next_payout_date` - Next scheduled payout
- `created_at`, `updated_at` - Timestamps

### Row Level Security (RLS)
- Landscapers can view their own payouts and schedules
- Landscapers can update their own payout schedule
- Admins have full access to all payouts and schedules

## Edge Functions

### `automated-payout-processor`
**Purpose**: Monitors completed jobs and initiates automatic payouts

**Trigger**: Should be called via cron job (daily recommended)

**Process**:
1. Queries all landscapers with `auto_payout_enabled = true` and `next_payout_date <= NOW()`
2. For each landscaper:
   - Fetches completed jobs with `payment_status = 'paid'` and no `payout_id`
   - Calculates total payout amount (90% of job total - 10% platform fee)
   - Checks if amount meets minimum payout threshold
   - Creates Stripe payout via Connect API
   - Records payout in database
   - Updates jobs with payout_id
   - Updates payout schedule with next payout date
   - Sends email notification via unified-email function

**Error Handling**:
- Failed payouts are recorded with status 'failed' and error details
- Landscapers are notified of failures
- System continues processing other landscapers

**Response**:
```json
{
  "success": true,
  "processed": 5,
  "results": [
    {
      "landscaper_id": "uuid",
      "success": true,
      "amount": 450.00,
      "payout_id": "po_xxx"
    }
  ]
}
```

## Frontend Components

### 1. `PayoutDashboard` Component
**Location**: `src/components/landscaper/PayoutDashboard.tsx`

**Features**:
- Summary cards showing:
  - Pending earnings (jobs completed but not paid out)
  - Next scheduled payout date
  - Total paid out to date
- Payout history list with:
  - Amount, status, dates
  - Job count per payout
  - Stripe payout ID
  - Failure messages (if applicable)
- Filters:
  - Status filter (all, paid, processing, pending, failed)
  - Date range picker
  - Clear filters button
- Export to CSV functionality
- Real-time status badges with icons

### 2. `PayoutScheduleManager` Component
**Location**: `src/components/landscaper/PayoutScheduleManager.tsx`

**Features**:
- Configure payout frequency:
  - Daily
  - Weekly (select day of week)
  - Monthly (select day of month)
  - Manual (no automatic payouts)
- Set minimum payout threshold
- Toggle automatic payouts on/off
- Save button with loading state
- Automatic next payout date calculation

### 3. `LandscaperPayouts` Page
**Location**: `src/pages/LandscaperPayouts.tsx`

**Features**:
- Tabbed interface:
  - Dashboard tab (payout history and stats)
  - Settings tab (schedule configuration)
- Protected route (landscaper role required)
- Responsive design

## Routes Added

```typescript
/landscaper-payouts - Main payouts page
/pro-payouts - Alias for landscaper payouts
```

Both routes are protected and require landscaper role.

## Email Notifications

### Payout Initiated
Sent when payout is successfully created:
- Template: `payout_initiated`
- Data:
  - `amount` - Payout amount
  - `job_count` - Number of jobs included
  - `arrival_date` - Expected arrival date
  - `payout_id` - Stripe payout ID

### Payout Failed
Sent when payout creation fails:
- Template: `payout_failed`
- Data:
  - `amount` - Attempted payout amount
  - `error_message` - Failure reason
  - `job_count` - Number of jobs affected

## Setup Instructions

### 1. Database Setup
Run the migration to add missing columns:
```sql
-- Already executed via run_supabase_query
-- Adds job_ids, failure_code, failure_message, metadata to payouts
-- Adds minimum_payout, payout_day, auto_payout_enabled, last_payout_date, next_payout_date to payout_schedules
```

### 2. Edge Function Deployment
The `automated-payout-processor` function is already deployed.

### 3. Cron Job Setup
Set up a cron job to call the edge function daily:

**Option A: Supabase Cron (Recommended)**
```sql
-- Create pg_cron extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily payout processing at 2 AM UTC
SELECT cron.schedule(
  'process-daily-payouts',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/automated-payout-processor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**Option B: External Cron Service**
Use a service like GitHub Actions, Vercel Cron, or cron-job.org to call:
```
POST https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/automated-payout-processor
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

### 4. Email Templates
Add email templates to unified-email function:

**payout_initiated.html**:
```html
<h2>Payout Initiated</h2>
<p>Your payout of ${{amount}} has been initiated and will arrive on {{arrival_date}}.</p>
<p>This payout includes {{job_count}} completed jobs.</p>
<p>Payout ID: {{payout_id}}</p>
```

**payout_failed.html**:
```html
<h2>Payout Failed</h2>
<p>We encountered an issue processing your payout of ${{amount}}.</p>
<p>Error: {{error_message}}</p>
<p>Please contact support or update your banking information.</p>
```

## Usage

### For Landscapers

1. **Configure Payout Schedule**:
   - Navigate to `/landscaper-payouts` or `/pro-payouts`
   - Click "Settings" tab
   - Select payout frequency (daily, weekly, monthly)
   - Set minimum payout amount
   - Enable automatic payouts
   - Save settings

2. **View Payout History**:
   - Navigate to "Dashboard" tab
   - View pending earnings
   - See next scheduled payout
   - Filter payout history by status or date
   - Export history to CSV

3. **Track Payouts**:
   - Receive email when payout is initiated
   - Check arrival date in dashboard
   - View payout status (processing → paid)

### For Admins

Monitor payouts via database queries:
```sql
-- View all pending payouts
SELECT * FROM payouts WHERE status = 'pending';

-- View failed payouts
SELECT * FROM payouts WHERE status = 'failed';

-- View landscapers with auto-payout enabled
SELECT l.*, ps.* 
FROM landscapers l
JOIN payout_schedules ps ON ps.landscaper_id = l.id
WHERE ps.auto_payout_enabled = true;
```

## Platform Fee Structure

Current implementation:
- **Landscaper receives**: 90% of job total
- **Platform fee**: 10% of job total

Example:
- Job total: $500
- Landscaper payout: $450
- Platform fee: $50

## Payout Timing

### Daily Schedule
- Payouts processed every day at scheduled time
- Minimum threshold must be met

### Weekly Schedule
- Payouts processed on selected day of week
- Example: Every Friday at 2 AM UTC

### Monthly Schedule
- Payouts processed on selected day of month
- Example: 1st of every month

### Manual Schedule
- No automatic payouts
- Landscaper must request payout manually (future feature)

## Testing

### Test Payout Creation
```javascript
// Call edge function manually
const response = await fetch(
  'https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/automated-payout-processor',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type': 'application/json'
    }
  }
);
const result = await response.json();
console.log(result);
```

### Test Schedule Configuration
1. Log in as landscaper
2. Navigate to `/landscaper-payouts`
3. Configure schedule with low minimum ($1)
4. Complete a test job
5. Manually trigger payout processor
6. Verify payout appears in dashboard

## Monitoring

### Key Metrics to Monitor
- Total payouts processed per day
- Failed payout rate
- Average payout amount
- Time from job completion to payout
- Landscaper payout schedule adoption rate

### Database Queries
```sql
-- Daily payout summary
SELECT 
  DATE(payout_date) as date,
  COUNT(*) as payout_count,
  SUM(amount) as total_amount,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count
FROM payouts
WHERE payout_date >= NOW() - INTERVAL '30 days'
GROUP BY DATE(payout_date)
ORDER BY date DESC;

-- Landscapers with pending earnings
SELECT 
  l.id,
  l.business_name,
  COUNT(j.id) as pending_jobs,
  SUM(j.total_amount * 0.9) as pending_earnings
FROM landscapers l
JOIN jobs j ON j.landscaper_id = l.id
WHERE j.status = 'completed'
  AND j.payment_status = 'paid'
  AND j.payout_id IS NULL
GROUP BY l.id, l.business_name
HAVING SUM(j.total_amount * 0.9) > 0;
```

## Future Enhancements

1. **Instant Payouts**: Allow landscapers to request instant payouts for a fee
2. **Payout Analytics**: Add charts showing payout trends over time
3. **Tax Documents**: Generate 1099 forms at year-end
4. **Multi-Currency**: Support payouts in different currencies
5. **Payout Holds**: Allow admins to hold payouts pending review
6. **Batch Payouts**: Process multiple landscapers in single Stripe batch
7. **Payout Notifications**: SMS notifications for payout events
8. **Dispute Resolution**: Handle payout disputes and chargebacks

## Troubleshooting

### Payout Not Processing
1. Check landscaper has Stripe Connect account set up
2. Verify `charges_enabled` and `payouts_enabled` are true
3. Check minimum payout threshold is met
4. Verify `auto_payout_enabled` is true
5. Check `next_payout_date` is in the past

### Payout Failed
1. Check Stripe Connect account status
2. Verify bank account is valid
3. Check for insufficient balance
4. Review failure_code and failure_message in payouts table
5. Contact Stripe support if needed

### Email Not Received
1. Check email_logs table for delivery status
2. Verify unified-email function is working
3. Check spam folder
4. Verify email address in users table

## Security Considerations

1. **Service Role Key**: Keep service role key secure, only use in edge functions
2. **RLS Policies**: Ensure landscapers can only view their own payouts
3. **Payout Validation**: Verify job ownership before creating payout
4. **Minimum Thresholds**: Prevent micro-payouts that incur high fees
5. **Rate Limiting**: Prevent abuse of manual payout requests (future)
6. **Audit Trail**: All payouts logged with full details

## Support

For issues or questions:
1. Check this documentation
2. Review database logs
3. Check Stripe dashboard for payout status
4. Review edge function logs in Supabase dashboard
5. Contact development team

---

**Implementation Date**: 2025-10-12  
**Version**: 1.0  
**Status**: Production Ready