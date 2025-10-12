# Payment Notification System Implementation Guide

## Overview
Comprehensive automated email notification system for critical payment events with configurable rules, escalation management, and detailed monitoring.

## Components Created

### 1. PaymentNotificationSystem.tsx
- Real-time alert dashboard for admins
- Configurable notification rules interface
- Alert acknowledgment and escalation tracking
- Severity-based color coding and icons

### 2. paymentNotificationService.ts
- Core notification processing engine
- Event-driven architecture with rule evaluation
- Template rendering with variable substitution
- Escalation scheduling and cooldown management
- Integration with Supabase Edge Functions

### 3. EmailTemplateBuilder.tsx
- Visual email template editor
- HTML and text content support
- Variable substitution preview
- Template management with CRUD operations
- Severity-based template organization

### 4. apiResponseHandler.ts
- Fixes JSON parsing errors (resolves the "<!DOCTYPE" issue)
- Graceful handling of HTML error responses
- Comprehensive API response validation
- Supabase response handling utilities

## Key Features

### Notification Types
- **Failed Payments**: Threshold-based alerts for payment failures
- **Webhook Failures**: Critical alerts for Stripe webhook issues
- **System Downtime**: Infrastructure monitoring alerts
- **Commission Payout Failures**: Landscaper payment issues
- **High Refund Rates**: Unusual refund activity detection

### Escalation Rules
- Configurable escalation timeouts (15-60 minutes)
- Multi-tier recipient lists
- Automatic escalation to senior staff
- Cooldown periods to prevent spam

### Template System
- Dynamic variable substitution ({{variable}})
- HTML and plain text versions
- Severity-based templates
- Preview functionality with test data

### Monitoring & Reporting
- Real-time alert dashboard
- Notification delivery tracking
- Escalation audit trail
- Performance metrics and analytics

## Configuration

### Database Tables Required
```sql
-- Notification rules
CREATE TABLE notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  condition TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT true,
  recipients TEXT[] NOT NULL,
  template_id UUID REFERENCES notification_templates(id),
  escalation_minutes INTEGER DEFAULT 30,
  cooldown_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES notification_rules(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  recipients TEXT[] NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Environment Variables
```env
# Email service configuration
RESEND_API_KEY=your_resend_api_key
NOTIFICATION_FROM_EMAIL=alerts@greenscapelux.com
ESCALATION_EMAIL=admin@greenscapelux.com
```

## Usage Examples

### Processing Payment Events
```typescript
import { paymentNotificationService } from '@/utils/paymentNotificationService';

// Failed payment event
await paymentNotificationService.processEvent({
  type: 'payment_failed',
  severity: 'high',
  data: {
    failedCount: 7,
    timeWindow: '1 hour',
    totalAmount: 350.00
  },
  timestamp: new Date()
});

// Webhook failure event
await paymentNotificationService.processEvent({
  type: 'webhook_failed',
  severity: 'critical',
  data: {
    webhookFailures: 3,
    endpoint: '/webhook/stripe',
    error: 'Connection timeout'
  },
  timestamp: new Date()
});
```

### Manual Testing
```typescript
// Test notification system
const success = await paymentNotificationService.testNotification('rule-id-123', {
  failedCount: 5,
  severity: 'high',
  timestamp: new Date().toISOString()
});
```

## Integration Points

### Admin Dashboard
Add to AdminDashboard.tsx:
```typescript
import { PaymentNotificationSystem } from '@/components/admin/PaymentNotificationSystem';

// Add as a tab or section
<PaymentNotificationSystem />
```

### Payment Processing
Integrate with existing payment flows:
```typescript
// In payment failure handlers
import { paymentNotificationService } from '@/utils/paymentNotificationService';

if (paymentFailed) {
  await paymentNotificationService.processEvent({
    type: 'payment_failed',
    severity: 'high',
    data: { failedCount: getFailedPaymentCount() },
    timestamp: new Date()
  });
}
```

## Monitoring & Maintenance

### Health Checks
- Monitor notification delivery rates
- Track escalation frequency
- Audit rule effectiveness
- Review template performance

### Performance Optimization
- Implement notification batching for high-volume events
- Use Redis for cooldown management in production
- Optimize template rendering for large recipient lists
- Monitor Edge Function execution times

## Security Considerations

### Data Protection
- Sanitize all template variables
- Validate recipient email addresses
- Encrypt sensitive notification data
- Implement rate limiting for notification endpoints

### Access Control
- Admin-only access to notification configuration
- Role-based template editing permissions
- Audit logging for all configuration changes
- Secure API endpoints with authentication

## Troubleshooting

### Common Issues
1. **JSON Parsing Errors**: Fixed with apiResponseHandler.ts
2. **Template Variables Not Rendering**: Check variable names match event data
3. **Notifications Not Sending**: Verify Resend API key and Edge Function deployment
4. **Escalations Not Triggering**: Check escalation timer configuration

### Debug Mode
Enable detailed logging:
```typescript
// Set environment variable
VITE_DEBUG_NOTIFICATIONS=true
```

## Next Steps
1. Deploy notification database tables
2. Configure Resend API integration
3. Set up monitoring dashboards
4. Create initial notification templates
5. Test with staging payment events