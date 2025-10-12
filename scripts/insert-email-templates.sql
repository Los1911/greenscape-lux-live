-- Insert comprehensive email templates for all notification types
-- Run this after the email notification system migration

-- Job Status Update Templates
INSERT INTO email_templates (name, type, subject, html_content) VALUES
('Job Status Update', 'job_status_update', 'Update on Your Landscaping Job - {{job.title}}', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #16a34a; margin: 0; font-size: 28px;">{{company.name}}</h1>
      <p style="color: #6b7280; margin: 5px 0 0 0;">Professional Landscaping Services</p>
    </div>
    
    <h2 style="color: #1f2937; margin-bottom: 20px;">Job Status Update</h2>
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello {{user.name}},</p>
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Your landscaping job status has been updated:</p>
    
    <div style="background: #f0f9ff; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 20px;">{{job.title}}</h3>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Current Status:</strong> <span style="color: #16a34a; font-weight: bold;">{{job.status}}</span></p>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Last Updated:</strong> {{job.updated_date}}</p>
      {{#if job.date}}<p style="margin: 8px 0; color: #1f2937;"><strong>Scheduled Date:</strong> {{job.date}}</p>{{/if}}
    </div>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">We will keep you updated as work progresses. If you have any questions, please don''t hesitate to contact us.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="color: #6b7280; margin: 0;">Questions? Call us at {{company.phone}}</p>
    </div>
    
    <p style="color: #374151; font-size: 16px;">Best regards,<br><strong>The {{company.name}} Team</strong></p>
  </div>
</div>'),

-- Payment Confirmation Template
('Payment Confirmation', 'payment_confirmation', 'Payment Confirmed - Thank You!', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: #16a34a; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 15px;">✓</div>
      <h1 style="color: #16a34a; margin: 0; font-size: 28px;">Payment Confirmed</h1>
    </div>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello {{user.name}},</p>
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Your payment has been successfully processed. Thank you for choosing {{company.name}}!</p>
    
    <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #16a34a;">
      <h3 style="color: #15803d; margin: 0 0 15px 0;">Payment Details</h3>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Amount Paid:</strong> ${{payment.amount}}</p>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Transaction ID:</strong> {{payment.transaction_id}}</p>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Service:</strong> {{job.title}}</p>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Payment Date:</strong> {{payment.date}}</p>
    </div>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">A receipt has been sent to your email. You can also view your payment history in your account dashboard.</p>
    
    <p style="color: #374151; font-size: 16px;">Thank you for your business!<br><strong>The {{company.name}} Team</strong></p>
  </div>
</div>'),

-- Review Request Template
('Review Request', 'review_request', 'How was your experience with {{company.name}}?', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #16a34a; margin: 0; font-size: 28px;">{{company.name}}</h1>
      <p style="color: #6b7280; margin: 5px 0 0 0;">We Value Your Feedback</p>
    </div>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello {{user.name}},</p>
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">We hope you''re satisfied with the landscaping work we recently completed for you!</p>
    
    <div style="background: #fefce8; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #eab308;">
      <h3 style="color: #a16207; margin: 0 0 15px 0;">Completed Service</h3>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Service:</strong> {{job.title}}</p>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Completed by:</strong> {{landscaper.name}}</p>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Completion Date:</strong> {{job.completion_date}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="color: #374151; font-size: 18px; margin-bottom: 20px;">Would you mind sharing your experience?</p>
      <a href="{{review.link}}" style="background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Leave a Review</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; text-align: center;">Your feedback helps us improve our services and helps other customers make informed decisions.</p>
    
    <p style="color: #374151; font-size: 16px;">Thank you for choosing {{company.name}}!<br><strong>The {{company.name}} Team</strong></p>
  </div>
</div>'),

-- Quote Submission Confirmation
('Quote Submission', 'quote_submission', 'Quote Request Received - We''ll Be In Touch Soon!', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #16a34a; margin: 0; font-size: 28px;">{{company.name}}</h1>
      <p style="color: #6b7280; margin: 5px 0 0 0;">Professional Landscaping Services</p>
    </div>
    
    <h2 style="color: #1f2937; margin-bottom: 20px;">Quote Request Received</h2>
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello {{user.name}},</p>
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Thank you for your interest in our landscaping services! We have received your quote request and will review it shortly.</p>
    
    <div style="background: #f0f9ff; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
      <h3 style="color: #1e40af; margin: 0 0 15px 0;">Request Details</h3>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Service Type:</strong> {{quote.service_type}}</p>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Property Address:</strong> {{quote.address}}</p>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Preferred Contact:</strong> {{quote.contact_method}}</p>
      <p style="margin: 8px 0; color: #1f2937;"><strong>Submitted:</strong> {{quote.submitted_date}}</p>
    </div>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h4 style="color: #92400e; margin: 0 0 10px 0;">What Happens Next?</h4>
      <ul style="color: #1f2937; margin: 0; padding-left: 20px;">
        <li>Our team will review your request within 24 hours</li>
        <li>We''ll contact you to schedule a property assessment</li>
        <li>You''ll receive a detailed quote within 2-3 business days</li>
      </ul>
    </div>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">If you have any questions or need to make changes to your request, please contact us at {{company.phone}}.</p>
    
    <p style="color: #374151; font-size: 16px;">Best regards,<br><strong>The {{company.name}} Team</strong></p>
  </div>
</div>')

ON CONFLICT (type, version) DO NOTHING;