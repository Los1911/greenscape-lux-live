-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'profile_confirmation',
    'job_assignment', 
    'job_completion',
    'appointment_reminder',
    'welcome_email',
    'password_reset'
  )),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(type, version)
);

-- Template Versions Table for History
CREATE TABLE IF NOT EXISTS email_template_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_template_versions_template_id ON email_template_versions(template_id);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;

-- Admin-only access for email templates
CREATE POLICY "Admin can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage template versions" ON email_template_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to create template version on update
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert old version into versions table
  INSERT INTO email_template_versions (
    template_id, version, subject, html_content, created_by
  ) VALUES (
    OLD.id, OLD.version, OLD.subject, OLD.html_content, OLD.created_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for versioning
DROP TRIGGER IF EXISTS template_versioning_trigger ON email_templates;
CREATE TRIGGER template_versioning_trigger
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  WHEN (OLD.html_content IS DISTINCT FROM NEW.html_content OR OLD.subject IS DISTINCT FROM NEW.subject)
  EXECUTE FUNCTION create_template_version();

-- Function to get active template by type
CREATE OR REPLACE FUNCTION get_active_template(template_type TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  subject TEXT,
  html_content TEXT,
  version INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.subject, t.html_content, t.version
  FROM email_templates t
  WHERE t.type = template_type 
    AND t.is_active = true
  ORDER BY t.version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Insert default templates
INSERT INTO email_templates (name, type, subject, html_content, created_by) VALUES
('Profile Confirmation', 'profile_confirmation', 'Profile Updated Successfully', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #16a34a;">{{company.name}}</h1>
  <p>Hello {{user.name}},</p>
  <p>Your profile has been successfully updated. Here are the details:</p>
  <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Email:</strong> {{user.email}}</p>
    <p><strong>Updated:</strong> {{update.date}}</p>
  </div>
  <p>If you did not make these changes, please contact us immediately.</p>
  <p>Best regards,<br>The {{company.name}} Team</p>
</div>', 
(SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

('Job Assignment', 'job_assignment', 'New Landscaper Assigned to Your Job', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #16a34a;">{{company.name}}</h1>
  <p>Hello {{user.name}},</p>
  <p>Great news! We have assigned a landscaper to your job:</p>
  <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h3>{{job.title}}</h3>
    <p><strong>Landscaper:</strong> {{landscaper.name}}</p>
    <p><strong>Scheduled Date:</strong> {{job.date}}</p>
    <p><strong>Location:</strong> {{job.address}}</p>
  </div>
  <p>Your landscaper will contact you soon to confirm details.</p>
  <p>Best regards,<br>The {{company.name}} Team</p>
</div>', 
(SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

('Job Completion', 'job_completion', 'Your Landscaping Job is Complete!', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #16a34a;">{{company.name}}</h1>
  <p>Hello {{user.name}},</p>
  <p>Your landscaping job has been completed successfully!</p>
  <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h3>{{job.title}}</h3>
    <p><strong>Completed by:</strong> {{landscaper.name}}</p>
    <p><strong>Completion Date:</strong> {{job.completion_date}}</p>
    <p><strong>Location:</strong> {{job.address}}</p>
  </div>
  <p>We hope you are satisfied with the work. Please consider leaving a review!</p>
  <p>Best regards,<br>The {{company.name}} Team</p>
</div>', 
(SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

('Appointment Reminder', 'appointment_reminder', 'Reminder: Upcoming Landscaping Appointment', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #16a34a;">{{company.name}}</h1>
  <p>Hello {{user.name}},</p>
  <p>This is a reminder about your upcoming landscaping appointment:</p>
  <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
    <h3>{{job.title}}</h3>
    <p><strong>Date & Time:</strong> {{job.date}}</p>
    <p><strong>Landscaper:</strong> {{landscaper.name}}</p>
    <p><strong>Location:</strong> {{job.address}}</p>
  </div>
  <p>Please ensure someone is available at the scheduled time.</p>
  <p>Contact us at {{company.phone}} if you need to reschedule.</p>
  <p>Best regards,<br>The {{company.name}} Team</p>
</div>', 
(SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (type, version) DO NOTHING;