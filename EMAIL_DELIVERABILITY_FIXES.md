# Email Deliverability Fixes

## Immediate Actions to Take

### 1. Domain Authentication Setup
```bash
# Add these DNS records to your domain:

# SPF Record (TXT)
Name: @
Value: "v=spf1 include:_spf.resend.com ~all"

# DKIM Record (CNAME) 
Name: resend._domainkey
Value: resend._domainkey.resend.com

# DMARC Record (TXT)
Name: _dmarc
Value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@greenscapelux.com"
```

### 2. Update Unified Email Function
Key changes needed in the unified-email function:

```typescript
// Use authenticated domain consistently
from: 'noreply@greenscapelux.com'

// Add proper headers
headers: {
  'X-Priority': '3',
  'X-MSMail-Priority': 'Normal',
  'X-Mailer': 'GreenScape Lux Platform'
}

// Include both HTML and text versions
html: htmlContent,
text: textContent // Always provide plain text
```

### 3. Content Optimization
- Remove spam trigger words: "FREE", "URGENT", excessive punctuation
- Use proper HTML structure with alt tags for images  
- Include unsubscribe links for marketing emails
- Keep HTML/text ratio balanced

### 4. Sender Reputation
- Monitor bounce rates (keep under 5%)
- Handle unsubscribes properly
- Use consistent from addresses
- Warm up new domains gradually

### 5. Testing Strategy
```bash
# Run deliverability test
node scripts/email-deliverability-checker.js your-email@domain.com

# Test multiple providers
node scripts/email-deliverability-checker.js gmail-test@gmail.com
node scripts/email-deliverability-checker.js outlook-test@outlook.com
```

## Monitoring & Debugging

### Resend Dashboard Checks
1. Domain verification status
2. Email delivery rates
3. Bounce/complaint statistics
4. Webhook event logs

### DNS Verification Tools
- MXToolbox.com for SPF/DKIM/DMARC validation
- Google Admin Toolbox for DNS lookup
- Resend's domain verification tool

### Email Testing Tools
- Mail-tester.com for spam score analysis
- GlockApps for inbox placement testing
- Litmus for email client compatibility

## Common Issues & Solutions

### Issue: 200 Success but No Delivery
**Cause**: Domain not authenticated or content flagged
**Solution**: Verify DNS records, improve content quality

### Issue: High Bounce Rate
**Cause**: Invalid email addresses or reputation issues
**Solution**: Implement email validation, clean lists

### Issue: Spam Folder Delivery
**Cause**: Content triggers or missing authentication
**Solution**: Optimize content, ensure SPF/DKIM setup

### Issue: Corporate Email Blocking
**Cause**: Strict security policies
**Solution**: Use established domains, proper authentication