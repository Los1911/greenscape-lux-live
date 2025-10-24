# Dispute Analytics System Implementation

## Overview
Comprehensive dispute analytics dashboard for admins with advanced metrics, charts, and automated insights.

## Features Implemented

### 1. DisputeAnalyticsDashboard Component
**Location:** `src/components/admin/DisputeAnalyticsDashboard.tsx`

**Key Metrics:**
- Total disputes count
- Average resolution time (in hours)
- Resolution rate percentage
- Pending disputes count

**Analytics Charts:**
1. **Dispute Trends** - Line chart showing dispute volume and resolutions over 30 days
2. **Disputes by Status** - Pie chart with status distribution (Pending/Under Review/Resolved/Rejected)
3. **Top Dispute Reasons** - Bar chart showing most common dispute reasons
4. **Resolution Time Distribution** - Bar chart with time ranges (<24h, 1-3 days, 3-7 days, >7 days)

**Filters:**
- Date range selector (default: last 30 days)
- Landscaper filter (all or specific landscaper)
- Export to CSV functionality

### 2. Admin Dashboard Integration
**Location:** `src/pages/AdminDashboard.tsx`

- Added "Analytics" tab to admin dashboard
- Integrated DisputeAnalyticsDashboard component
- Responsive tab layout with 12-column grid

## Usage

### Accessing Analytics
1. Navigate to Admin Dashboard
2. Click "Analytics" tab
3. View comprehensive dispute metrics and charts

### Filtering Data
```typescript
// Filter by landscaper
<Select value={selectedLandscaper} onValueChange={setSelectedLandscaper}>
  <SelectItem value="all">All Landscapers</SelectItem>
  {landscapers.map(l => (
    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
  ))}
</Select>

// Filter by date range (default: last 30 days)
const [dateRange, setDateRange] = useState({
  from: new Date(new Date().setDate(new Date().getDate() - 30)),
  to: new Date()
});
```

### Exporting Data
```typescript
const exportToCSV = () => {
  const csv = [
    ['Dispute Analytics Report'],
    [`Date Range: ${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`],
    [''],
    ['Metric', 'Value'],
    ['Total Disputes', analytics.totalDisputes],
    ['Pending Disputes', analytics.pendingDisputes],
    ['Resolved Disputes', analytics.resolvedDisputes],
    ['Rejected Disputes', analytics.rejectedDisputes],
    ['Average Resolution Time (hours)', analytics.averageResolutionTime.toFixed(2)],
    ['Resolution Rate (%)', analytics.resolutionRate.toFixed(2)]
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dispute-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
};
```

## Database Queries

### Fetch Analytics Data
```sql
-- Get disputes with date range and landscaper filter
SELECT 
  pd.*,
  l.business_name
FROM payout_disputes pd
JOIN landscapers l ON pd.landscaper_id = l.id
WHERE pd.created_at >= '2025-01-01'
  AND pd.created_at <= '2025-12-31'
  AND (pd.landscaper_id = 'specific-id' OR 'all' = 'all')
ORDER BY pd.created_at DESC;
```

### Calculate Resolution Time
```typescript
const avgTime = resolvedDisputes.length > 0
  ? resolvedDisputes.reduce((acc, d) => {
      const created = new Date(d.created_at).getTime();
      const resolved = new Date(d.resolved_at).getTime();
      return acc + (resolved - created);
    }, 0) / resolvedDisputes.length / (1000 * 60 * 60)
  : 0;
```

## Automated Escalation Rules

### Future Implementation
```typescript
// Escalation rules to be implemented
interface EscalationRule {
  id: string;
  condition: 'time_threshold' | 'amount_threshold' | 'repeat_offender';
  threshold: number;
  action: 'notify_admin' | 'auto_approve' | 'priority_review';
  enabled: boolean;
}

// Example: Auto-escalate disputes pending > 72 hours
const escalationRules = [
  {
    condition: 'time_threshold',
    threshold: 72, // hours
    action: 'notify_admin',
    enabled: true
  },
  {
    condition: 'amount_threshold',
    threshold: 500, // dollars
    action: 'priority_review',
    enabled: true
  }
];
```

## Key Insights

### Resolution Rate Calculation
```typescript
const resolutionRate = totalDisputes > 0 
  ? (resolvedDisputes / totalDisputes) * 100 
  : 0;
```

### Trend Analysis
- 30-day rolling window for dispute trends
- Day-by-day comparison of disputes vs resolutions
- Identifies patterns in dispute volume

### Common Dispute Reasons
- Tracks top 5 most frequent dispute reasons
- Helps identify systemic issues
- Guides policy improvements

## Performance Considerations

1. **Data Caching:** Analytics data refreshes on filter change
2. **Optimized Queries:** Uses Supabase indexes on created_at and landscaper_id
3. **Chart Rendering:** Uses recharts for efficient visualization
4. **CSV Export:** Client-side generation for fast exports

## Future Enhancements

1. **Automated Escalation:**
   - Time-based escalation (>72 hours pending)
   - Amount-based escalation (>$500)
   - Repeat offender detection

2. **Predictive Analytics:**
   - ML-based dispute prediction
   - Risk scoring for landscapers
   - Seasonal trend forecasting

3. **Advanced Reporting:**
   - Custom report builder
   - Scheduled email reports
   - PDF export with charts

4. **Real-time Alerts:**
   - Slack/email notifications for high-priority disputes
   - Dashboard alerts for unusual patterns
   - SLA breach warnings

## Testing

### Manual Testing Checklist
- [ ] View analytics with no disputes
- [ ] View analytics with multiple disputes
- [ ] Filter by specific landscaper
- [ ] Filter by date range
- [ ] Export CSV file
- [ ] Verify chart rendering
- [ ] Test responsive layout
- [ ] Verify metric calculations

### Sample Data Generation
```sql
-- Insert sample disputes for testing
INSERT INTO payout_disputes (
  payout_id,
  landscaper_id,
  reason,
  description,
  amount_disputed,
  status,
  created_at,
  resolved_at
) VALUES
  ('payout-1', 'landscaper-1', 'incorrect_amount', 'Amount does not match agreement', 150.00, 'resolved', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
  ('payout-2', 'landscaper-2', 'payment_failed', 'Payment failed to process', 200.00, 'pending', NOW() - INTERVAL '3 days', NULL),
  ('payout-3', 'landscaper-1', 'delayed_payout', 'Payout delayed beyond schedule', 100.00, 'under_review', NOW() - INTERVAL '1 day', NULL);
```

## Monitoring

### Key Metrics to Track
1. Average time to resolution (target: <48 hours)
2. Resolution rate (target: >90%)
3. Dispute volume trends
4. Most common dispute reasons
5. Landscaper dispute frequency

### Dashboard Health Indicators
- Green: <10 pending disputes, >90% resolution rate
- Yellow: 10-25 pending disputes, 80-90% resolution rate
- Red: >25 pending disputes, <80% resolution rate

## Conclusion
The dispute analytics system provides comprehensive insights into payout dispute patterns, resolution efficiency, and landscaper behavior. The dashboard enables data-driven decision making for dispute management and policy improvements.
