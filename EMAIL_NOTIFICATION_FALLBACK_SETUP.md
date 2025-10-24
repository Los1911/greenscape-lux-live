# Email Notification Fallback System Setup Guide

## Overview

This guide sets up a comprehensive email notification fallback system for GitHub Actions workflows. When Slack webhooks fail, the system automatically sends email notifications to ensure critical deployment alerts are never missed.

## Features

- **Multi-layer Fallback**: Slack → Email → GitHub Issues
- **Professional Email Templates**: HTML templates with responsive design
- **Configurable Recipients**: Support for multiple email addresses
- **SMTP Integration**: Works with Gmail, Outlook, SendGrid, and other providers
- **Template Customization**: Easy to modify email templates
- **Error Context**: Detailed error information and troubleshooting steps

## Setup Instructions

### 1. Configure SMTP Settings

Add the following secrets to your GitHub repository:

#### For Gmail SMTP:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
EMAIL_FROM=your-email@gmail.com
EMAIL_RECIPIENTS=admin@company.com,devops@company.com,alerts@company.com
```

#### For Outlook/Office 365:
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-password
EMAIL_FROM=your-email@company.com
EMAIL_RECIPIENTS=admin@company.com,devops@company.com
```

#### For SendGrid:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@company.com
EMAIL_RECIPIENTS=admin@company.com,devops@company.com
```

### 2. GitHub Secrets Configuration

Navigate to your repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username/email | `alerts@company.com` |
| `SMTP_PASS` | SMTP password/API key | `your-app-password` |
| `EMAIL_FROM` | From email address | `noreply@company.com` |
| `EMAIL_RECIPIENTS` | Comma-separated recipient list | `admin@company.com,dev@company.com` |

### 3. Gmail App Password Setup (if using Gmail)

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account settings → Security → App passwords
3. Generate an app password for "Mail"
4. Use this app password in the `SMTP_PASS` secret

### 4. Email Template Customization

Email templates are located in `email-templates/`:

- `validation_failed.html` - Environment validation failures
- `deployment_success.html` - Successful deployments
- `sync_failed.html` - Environment sync failures
- `build_failed.html` - Build process failures

#### Template Variables

Templates support the following variables:
- `{{commit}}` - Git commit hash
- `{{branch}}` - Git branch name
- `{{actor}}` - GitHub username who triggered the action
- `{{timestamp}}` - Current timestamp
- `{{error}}` - Error message details

#### Customizing Templates

1. Edit the HTML files in `email-templates/`
2. Use standard HTML and CSS (inline styles recommended)
3. Test templates by running: `npm run test:email-templates`

### 5. Testing the Email System

#### Test Email Notifications Locally:
```bash
# Test validation failed email
node scripts/email-notification.js validation_failed abc123 main developer "Test error message"

# Test deployment success email
node scripts/email-notification.js deployment_success abc123 main developer
```

#### Test in GitHub Actions:
```bash
# Trigger a test workflow
gh workflow run env-validation-status.yml
```

### 6. Notification Flow

The notification system follows this priority order:

1. **Primary**: Slack webhook notification
2. **Fallback 1**: Email notification (if Slack fails)
3. **Fallback 2**: GitHub Issue creation (if email fails)

### 7. Email Types and Triggers

| Email Type | Trigger | Template |
|------------|---------|----------|
| `validation_failed` | Environment validation fails | `validation_failed.html` |
| `sync_failed` | Environment sync to Vercel fails | `sync_failed.html` |
| `build_failed` | Build process fails | `build_failed.html` |
| `deployment_success` | Successful deployment | `deployment_success.html` |

### 8. Monitoring and Logs

#### Check Email Delivery Status:
- GitHub Actions logs show email send status
- SMTP errors are logged with details
- Email message IDs are logged on success

#### Common Issues and Solutions:

**Authentication Failed:**
- Verify SMTP credentials
- Check if 2FA is enabled (use app passwords)
- Ensure SMTP server allows less secure apps (if needed)

**Connection Timeout:**
- Verify SMTP_HOST and SMTP_PORT
- Check if firewall blocks SMTP ports
- Try alternative ports (465 for SSL, 587 for TLS)

**Email Not Received:**
- Check spam/junk folders
- Verify EMAIL_RECIPIENTS format
- Test with a single recipient first

### 9. Advanced Configuration

#### Custom SMTP Provider:
```bash
# Example for custom SMTP
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587
SMTP_USER=alerts@yourcompany.com
SMTP_PASS=your-password
EMAIL_FROM=github-actions@yourcompany.com
EMAIL_RECIPIENTS=devops@yourcompany.com
```

#### Multiple Recipient Groups:
```bash
# Different recipients for different environments
EMAIL_RECIPIENTS_PROD=cto@company.com,devops@company.com
EMAIL_RECIPIENTS_STAGING=developers@company.com
```

### 10. Security Best Practices

- **Never commit SMTP credentials** to your repository
- **Use app passwords** instead of regular passwords when possible
- **Limit SMTP user permissions** to sending only
- **Rotate SMTP credentials** regularly
- **Use dedicated email accounts** for automated notifications
- **Monitor email usage** to detect potential abuse

### 11. Troubleshooting

#### Debug Email Issues:
```bash
# Enable debug mode
DEBUG=true node scripts/email-notification.js validation_failed test test test "test error"
```

#### Test SMTP Connection:
```bash
# Test SMTP configuration
npm run test:smtp-connection
```

#### Common Error Messages:

**"Authentication failed"**
- Check SMTP_USER and SMTP_PASS
- Verify 2FA settings for Gmail

**"Connection timeout"**
- Check SMTP_HOST and SMTP_PORT
- Verify network connectivity

**"Invalid recipients"**
- Check EMAIL_RECIPIENTS format
- Ensure email addresses are valid

### 12. Maintenance

#### Regular Tasks:
- Monitor email delivery rates
- Update email templates as needed
- Review and rotate SMTP credentials
- Test fallback systems monthly
- Monitor GitHub Actions usage limits

#### Updating Templates:
1. Edit templates in `email-templates/`
2. Test locally with sample data
3. Deploy and verify in staging environment
4. Monitor delivery and formatting

## Support

For issues with the email notification system:

1. Check GitHub Actions logs for error details
2. Verify SMTP configuration and credentials
3. Test email delivery manually
4. Review template syntax and variables
5. Check spam filters and email client settings

The email fallback system ensures that critical deployment notifications are never missed, providing a reliable safety net when primary notification channels fail.