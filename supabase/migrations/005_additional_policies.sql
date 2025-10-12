-- Additional RLS Policies (Continued)
-- Completes the security policies for remaining tables

-- Job assignments policies
CREATE POLICY "Landscapers can view their assignments" ON public.job_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = job_assignments.landscaper_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view assignments for their jobs" ON public.job_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.clients c ON c.id = j.client_id
      WHERE j.id = job_assignments.job_id AND c.user_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Clients can view their payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = payments.client_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Landscapers can view their payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = payments.landscaper_id AND l.user_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Clients can manage reviews for their jobs" ON public.reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = reviews.client_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Landscapers can view their reviews" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = reviews.landscaper_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view verified reviews" ON public.reviews
  FOR SELECT USING (is_verified = true);

-- Payouts policies
CREATE POLICY "Landscapers can view their payouts" ON public.payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = payouts.landscaper_id AND l.user_id = auth.uid()
    )
  );

-- Job photos policies
CREATE POLICY "Users can view photos for jobs they're involved in" ON public.job_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      LEFT JOIN public.clients c ON c.id = j.client_id
      LEFT JOIN public.landscapers l ON l.id = j.landscaper_id
      WHERE j.id = job_photos.job_id 
      AND (c.user_id = auth.uid() OR l.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload photos for their jobs" ON public.job_photos
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Admin policies (full access for admin users)
CREATE POLICY "Admins have full access to all tables" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landscapers_updated_at BEFORE UPDATE ON public.landscapers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();