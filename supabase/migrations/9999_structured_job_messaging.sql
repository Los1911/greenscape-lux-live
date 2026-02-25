-- ============================================
-- STRUCTURED JOB MESSAGING MIGRATION
-- ============================================
-- Supports structured message types, contact info blocking,
-- and admin oversight for platform safety

-- Create job_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'landscaper', 'admin')),
  message_type TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  photo_url TEXT,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if table already exists (idempotent)
ALTER TABLE job_messages 
ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_job_messages_job_id ON job_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_sender_id ON job_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_created_at ON job_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_messages_job_created ON job_messages(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_messages_blocked ON job_messages(is_blocked) WHERE is_blocked = TRUE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE job_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "job_messages_select_participants" ON job_messages;
DROP POLICY IF EXISTS "job_messages_insert_participants" ON job_messages;
DROP POLICY IF EXISTS "job_messages_admin_all" ON job_messages;

-- Participants can view messages for their jobs
CREATE POLICY "job_messages_select_participants" ON job_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_messages.job_id 
      AND (
        jobs.client_id = auth.uid() 
        OR jobs.landscaper_id = auth.uid()
        OR jobs.assigned_to = auth.uid()
      )
    )
    OR
    -- Admin can view all messages
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Participants can insert messages for assigned/in_progress jobs
CREATE POLICY "job_messages_insert_participants" ON job_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_messages.job_id 
      AND jobs.status IN ('assigned', 'in_progress')
      AND (
        jobs.client_id = auth.uid() 
        OR jobs.landscaper_id = auth.uid()
        OR jobs.assigned_to = auth.uid()
      )
    )
  );

-- Admin can do everything
CREATE POLICY "job_messages_admin_all" ON job_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_job_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_job_messages_updated_at ON job_messages;
CREATE TRIGGER trigger_job_messages_updated_at
  BEFORE UPDATE ON job_messages
  FOR EACH ROW EXECUTE FUNCTION update_job_messages_updated_at();

-- ============================================
-- MESSAGE TYPE CONSTRAINTS
-- ============================================

-- Valid message types for landscapers
-- property_access, scope_clarification, material_confirmation, 
-- arrival_update, delay_notification, completion_note

-- Valid message types for clients
-- answer_question, approve_clarification, upload_reference, acknowledge_delay

-- Add check constraint for message types
ALTER TABLE job_messages DROP CONSTRAINT IF EXISTS job_messages_type_check;
ALTER TABLE job_messages ADD CONSTRAINT job_messages_type_check 
  CHECK (message_type IN (
    'general',
    'property_access',
    'scope_clarification', 
    'material_confirmation',
    'arrival_update',
    'delay_notification',
    'completion_note',
    'answer_question',
    'approve_clarification',
    'upload_reference',
    'acknowledge_delay'
  ));

-- ============================================
-- ADMIN AUDIT VIEW
-- ============================================

CREATE OR REPLACE VIEW admin_message_audit AS
SELECT 
  jm.id,
  jm.job_id,
  j.service_name as job_title,
  j.status as job_status,
  j.customer_name,
  jm.sender_id,
  jm.sender_role,
  jm.message_type,
  jm.message,
  jm.photo_url,
  jm.is_blocked,
  jm.blocked_reason,
  jm.created_at,
  u.email as sender_email
FROM job_messages jm
JOIN jobs j ON j.id = jm.job_id
LEFT JOIN auth.users u ON u.id = jm.sender_id
ORDER BY jm.created_at DESC;

-- Grant access to admin view
GRANT SELECT ON admin_message_audit TO authenticated;
