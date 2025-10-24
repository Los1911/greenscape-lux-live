-- ============================================
-- ENHANCE COMMUNICATIONS TABLE MIGRATION
-- ============================================

-- Add missing columns for comprehensive messaging
ALTER TABLE communications 
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES communications(id),
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create typing indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('client', 'landscaper')),
  is_typing BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message read receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Communications table indexes
CREATE INDEX IF NOT EXISTS idx_communications_job_id ON communications(job_id);
CREATE INDEX IF NOT EXISTS idx_communications_sender_id ON communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON communications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_job_created ON communications(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_unread ON communications(job_id) WHERE read_at IS NULL;

-- Typing indicators indexes
CREATE INDEX IF NOT EXISTS idx_typing_indicators_job_id ON typing_indicators(job_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_job ON typing_indicators(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_active ON typing_indicators(job_id, is_typing) WHERE is_typing = TRUE;

-- Message read receipts indexes
CREATE INDEX IF NOT EXISTS idx_message_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_receipts_user_id ON message_read_receipts(user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Update trigger for communications
CREATE OR REPLACE FUNCTION update_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_communications_updated_at ON communications;
CREATE TRIGGER trigger_communications_updated_at
  BEFORE UPDATE ON communications
  FOR EACH ROW EXECUTE FUNCTION update_communications_updated_at();

-- Update trigger for typing indicators
CREATE OR REPLACE FUNCTION update_typing_indicators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_typing_indicators_updated_at ON typing_indicators;
CREATE TRIGGER trigger_typing_indicators_updated_at
  BEFORE UPDATE ON typing_indicators
  FOR EACH ROW EXECUTE FUNCTION update_typing_indicators_updated_at();