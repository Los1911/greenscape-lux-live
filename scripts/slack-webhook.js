#!/usr/bin/env node

/**
 * Slack Webhook Notification Helper
 * Sends formatted notifications to Slack
 */

const https = require('https');

class SlackNotifier {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async send(message, options = {}) {
    const {
      title = 'Notification',
      emoji = '📢',
      color = '#36a64f',
      isError = false
    } = options;

    const payload = {
      text: `${emoji} ${title}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${title}`,
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_${new Date().toISOString()}_`
            }
          ]
        }
      ],
      attachments: [
        {
          color: isError ? '#ff0000' : color,
          footer: 'GreenScape Lux Deployment System',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    return this._post(payload);
  }

  async sendEnvValidation(missing, present, total) {
    const isError = missing.length > 0;
    const emoji = isError ? '🚨' : '✅';
    const title = isError ? 'Environment Variable Mismatch' : 'Environment Variables Valid';
    
    let message = `*Validation Results*\n\n`;
    message += `• Present: ${present.length}/${total}\n`;
    message += `• Missing: ${missing.length}/${total}\n\n`;
    
    if (missing.length > 0) {
      message += `*Missing Variables:*\n`;
      message += missing.map(v => `• \`${v}\``).join('\n');
      message += `\n\n_Configure in Vercel Dashboard → Settings → Environment Variables_`;
    }

    return this.send(message, { title, emoji, isError });
  }

  _post(payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.webhookUrl);
      const data = JSON.stringify(payload);

      const req = https.request({
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ success: true, body });
          } else {
            reject(new Error(`Slack API error: ${res.statusCode} ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

module.exports = SlackNotifier;

// CLI usage
if (require.main === module) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const message = process.argv[2] || 'Test notification';
  
  if (!webhookUrl) {
    console.error('❌ SLACK_WEBHOOK_URL environment variable not set');
    process.exit(1);
  }

  const notifier = new SlackNotifier(webhookUrl);
  notifier.send(message, { title: 'Test Notification', emoji: '🧪' })
    .then(() => {
      console.log('✅ Notification sent successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Failed to send notification:', err.message);
      process.exit(1);
    });
}
