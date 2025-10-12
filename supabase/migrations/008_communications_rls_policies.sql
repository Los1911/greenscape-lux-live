-- ============================================
-- COMMUNICATIONS RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "communications_job_access" ON communications;
DROP POLICY IF EXISTS "comms insert own jobs" ON communications;
DROP POLICY IF EXISTS "comms read own jobs" ON communications;

-- ============================================
-- COMMUNICATIONS TABLE POLICIES
-- ============================================

-- Users can read messages for jobs they're involved in
CREATE POLICY "communications_read_access" ON communications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = communications.job_id 
      AND (jobs.client_id = auth.uid() OR jobs.landscaper_id = auth.uid())
    )
  );

-- Users can send messages for jobs they're involved in
CREATE POLICY "communications_insert_access" ON communications
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = communications.job_id 
      AND (jobs.client_id = auth.uid() OR jobs.landscaper_id = auth.uid())
    )
  );

-- Users can update their own messages (for editing)
CREATE POLICY "communications_update_own" ON communications
  FOR UPDATE USING (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = communications.job_id 
      AND (jobs.client_id = auth.uid() OR jobs.landscaper_id = auth.uid())
    )
  );

-- Users can mark messages as read for jobs they're involved in
CREATE POLICY "communications_read_receipts" ON communications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = communications.job_id 
      AND (jobs.client_id = auth.uid() OR jobs.landscaper_id = auth.uid())
    )
  );

-- ============================================
-- TYPING INDICATORS POLICIES
-- ============================================

-- Users can see typing indicators for jobs they're involved in
CREATE POLICY "typing_indicators_read_access" ON typing_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = typing_indicators.job_id 
      AND (jobs.client_id = auth.uid() OR jobs.landscaper_id = auth.uid())
    )
  );

-- Users can manage their own typing indicators
CREATE POLICY "typing_indicators_manage_own" ON typing_indicators
  FOR ALL USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = typing_indicators.job_id 
      AND (jobs.client_id = auth.uid() OR jobs.landscaper_id = auth.uid())
    )
  );

-- ============================================
-- MESSAGE READ RECEIPTS POLICIES
-- ============================================

-- Users can see read receipts for messages in jobs they're involved in
CREATE POLICY "message_receipts_read_access" ON message_read_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM communications c
      JOIN jobs j ON j.id = c.job_id
      WHERE c.id = message_read_receipts.message_id
      AND (j.client_id = auth.uid() OR j.landscaper_id = auth.uid())
    )
  );

-- Users can manage their own read receipts
CREATE POLICY "message_receipts_manage_own" ON message_read_receipts
  FOR ALL USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM communications c
      JOIN jobs j ON j.id = c.job_id
      WHERE c.id = message_read_receipts.message_id
      AND (j.client_id = auth.uid() OR j.landscaper_id = auth.uid())
    )
  );