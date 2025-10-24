# Email Notification System - Complete Implementation Guide

## Overview
This guide sets up comprehensive automated email notifications for the landscaping application using Resend API integration with Supabase Edge Functions.

## Current System Status
✅ **Unified Email Function**: Already implemented in `supabase/functions/unified-email/index.ts`
✅ **Email Templates Database**: Schema defined in `src/utils/emailTemplateDatabase.ts`
✅ **Resend Integration**: Configured with retry logic and error handling

## Implementation Steps

### 1. Database Setup
Run the email templates migration:
```sql
-- Execute src/utils/emailTemplateDatabase.ts content in Supabase SQL Editor
```

### 2. Environment Variables
Ensure these are configured in Supabase:
- `RESEND_API_KEY`: Your Resend API key
- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key

### 3. Email Template Types
The system supports these notification types:
- `job_status_update`: Job progress notifications
- `quote_submission`: New quote requests
- `payment_confirmation`: Payment success notifications
- `review_request`: Request for customer reviews
- `job_assignment`: Landscaper assignment notifications
- `job_completion`: Job completion confirmations
- `appointment_reminder`: Upcoming appointment reminders
- `welcome_email`: New user welcome messages

### 4. Frontend Integration
Use the unified email function from your React components:

```typescript
import { supabase } from '@/lib/supabase'

const sendNotificationEmail = async (
  to: string | string[],
  templateType: string,
  templateData: Record<string, any>
) => {
  const { data, error } = await supabase.functions.invoke('unified-email', {
    body: {
      to,
      template_type: templateType,
      template_data: templateData
    }
  })
  
  if (error) {
    console.error('Email notification failed:', error)
    return false
  }
  
  return true
}
```

### 5. Automated Triggers
Set up database triggers for automatic notifications:

```sql
-- Job status update trigger
CREATE OR REPLACE FUNCTION notify_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Call edge function for email notification
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/unified-email',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '", "Content-Type": "application/json"}',
    body := json_build_object(
      'to', (SELECT email FROM profiles WHERE id = NEW.client_id),
      'template_type', 'job_status_update',
      'template_data', json_build_object(
        'user', json_build_object('name', (SELECT full_name FROM profiles WHERE id = NEW.client_id)),
        'job', json_build_object('title', NEW.title, 'status', NEW.status),
        'company', json_build_object('name', 'GreenScape Lux')
      )
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_status_notification_trigger
  AFTER UPDATE OF status ON jobs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_job_status_change();
```

## Email Templates

### Job Status Update Template
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #16a34a;">{{company.name}}</h1>
  <p>Hello {{user.name}},</p>
  <p>Your landscaping job status has been updated:</p>
  <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>{{job.title}}</h3>
    <p><strong>Status:</strong> {{job.status}}</p>
    <p><strong>Updated:</strong> {{job.updated_date}}</p>
  </div>
  <p>Best regards,<br>The {{company.name}} Team</p>
</div>
```

### Payment Confirmation Template
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #16a34a;">Payment Confirmed</h1>
  <p>Hello {{user.name}},</p>
  <p>Your payment has been successfully processed:</p>
  <div style="background: #f0f9ff; padding: 20px; border-radius: 8px;">
    <p><strong>Amount:</strong> ${{payment.amount}}</p>
    <p><strong>Transaction ID:</strong> {{payment.transaction_id}}</p>
    <p><strong>Service:</strong> {{job.title}}</p>
  </div>
  <p>Thank you for your business!</p>
</div>
```

## Testing
Test email notifications:

```typescript
// Test job status notification
await supabase.functions.invoke('unified-email', {
  body: {
    to: 'test@example.com',
    template_type: 'job_status_update',
    template_data: {
      user: { name: 'John Doe' },
      job: { title: 'Lawn Maintenance', status: 'In Progress' },
      company: { name: 'GreenScape Lux' }
    }
  }
})
```

## Monitoring
- Email delivery logs stored in `notification_logs` table
- Error tracking with retry logic
- Success/failure metrics available in admin dashboard

## Next Steps
1. Run database migrations for email templates
2. Configure Resend API key in Supabase secrets
3. Set up automated triggers for job status changes
4. Test email delivery for all notification types
5. Monitor delivery rates and error logs

The email notification system is now ready for production use with comprehensive template management and automated delivery.