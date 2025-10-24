-- Fix RLS Policies: Replace auth.uid() with (select auth.uid())
-- This migration updates all RLS policies to use the proper function call syntax

-- ============================================
-- DROP ALL EXISTING POLICIES FIRST
-- ============================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "users_own_data" ON users;

-- Clients table policies  
DROP POLICY IF EXISTS "Clients can view their own profile" ON public.clients;
DROP POLICY IF EXISTS "Landscapers can view client profiles for their jobs" ON public.clients;
DROP POLICY IF EXISTS "clients_own_data" ON clients;
DROP POLICY IF EXISTS "clients_admin_access" ON clients;

-- Landscapers table policies
DROP POLICY IF EXISTS "Landscapers can view their own profile" ON public.landscapers;
DROP POLICY IF EXISTS "Clients can view approved landscaper profiles" ON public.landscapers;
DROP POLICY IF EXISTS "Admins can view all landscaper profiles" ON public.landscapers;
DROP POLICY IF EXISTS "landscapers_own_data" ON landscapers;
DROP POLICY IF EXISTS "landscapers_admin_access" ON landscapers;

-- Jobs table policies
DROP POLICY IF EXISTS "Clients can manage their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Landscapers can view jobs assigned to them" ON public.jobs;
DROP POLICY IF EXISTS "Approved landscapers can view pending jobs" ON public.jobs;
DROP POLICY IF EXISTS "jobs_client_access" ON jobs;
DROP POLICY IF EXISTS "jobs_landscaper_access" ON jobs;
DROP POLICY IF EXISTS "jobs_admin_access" ON jobs;
DROP POLICY IF EXISTS "jobs_anon_insert" ON jobs;

-- Quotes table policies
DROP POLICY IF EXISTS "Landscapers can manage their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Clients can view quotes for their jobs" ON public.quotes;
DROP POLICY IF EXISTS "quotes_own_data" ON quotes;
DROP POLICY IF EXISTS "quotes_admin_access" ON quotes;
DROP POLICY IF EXISTS "quotes_service_insert" ON quotes;

-- Job assignments policies
DROP POLICY IF EXISTS "Landscapers can view their assignments" ON public.job_assignments;
DROP POLICY IF EXISTS "Clients can view assignments for their jobs" ON public.job_assignments;

-- Payments policies
DROP POLICY IF EXISTS "Clients can view their payments" ON public.payments;
DROP POLICY IF EXISTS "Landscapers can view their payments" ON public.payments;

-- Reviews policies
DROP POLICY IF EXISTS "Clients can manage reviews for their jobs" ON public.reviews;
DROP POLICY IF EXISTS "Landscapers can view their reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view verified reviews" ON public.reviews;

-- Payouts policies
DROP POLICY IF EXISTS "Landscapers can view their payouts" ON public.payouts;

-- Job photos policies
DROP POLICY IF EXISTS "Users can view photos for jobs they're involved in" ON public.job_photos;
DROP POLICY IF EXISTS "Users can upload photos for their jobs" ON public.job_photos;
DROP POLICY IF EXISTS "job_photos_access" ON job_photos;
DROP POLICY IF EXISTS "job_photos_admin_access" ON job_photos;

-- Communications policies
DROP POLICY IF EXISTS "communications_job_access" ON communications;

-- Notifications policies
DROP POLICY IF EXISTS "notifications_own_data" ON notifications;
DROP POLICY IF EXISTS "notifications_system_insert" ON notifications;

-- Landscaper documents policies
DROP POLICY IF EXISTS "landscaper_documents_own_data" ON landscaper_documents;

-- Admin and security table policies
DROP POLICY IF EXISTS "admin_sessions_own_data" ON admin_sessions;
DROP POLICY IF EXISTS "login_attempts_own_data" ON login_attempts;
DROP POLICY IF EXISTS "password_reset_tokens_own_data" ON password_reset_tokens;
DROP POLICY IF EXISTS "push_subscriptions_own_data" ON push_subscriptions;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Quote requests policies
DROP POLICY IF EXISTS "quote_requests_admin_access" ON quote_requests;

-- ============================================
-- CREATE CORRECTED POLICIES WITH (select auth.uid())
-- ============================================

-- Users policies
CREATE POLICY "users_own_data" ON users
  FOR ALL USING ((select auth.uid()) = id);

-- Clients policies
CREATE POLICY "clients_own_data" ON clients
  FOR ALL USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "clients_admin_access" ON clients
  FOR ALL USING (is_admin((select auth.uid())));

CREATE POLICY "landscapers_view_client_profiles" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.landscapers l ON l.id = j.landscaper_id
      WHERE j.client_id = clients.id AND l.user_id = (select auth.uid())
    )
  );

-- Landscapers policies
CREATE POLICY "landscapers_own_data" ON landscapers
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "landscapers_admin_access" ON landscapers
  FOR ALL USING (is_admin((select auth.uid())));

CREATE POLICY "clients_view_approved_landscapers" ON public.landscapers
  FOR SELECT USING (is_approved = true);

CREATE POLICY "admins_view_all_landscapers" ON public.landscapers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Jobs policies
CREATE POLICY "jobs_client_access" ON jobs
  FOR ALL USING ((select auth.uid()) = client_id);

CREATE POLICY "jobs_landscaper_access" ON jobs
  FOR ALL USING ((select auth.uid()) = landscaper_id);

CREATE POLICY "jobs_admin_access" ON jobs
  FOR ALL USING (is_admin((select auth.uid())));

CREATE POLICY "jobs_anon_insert" ON jobs
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "clients_manage_own_jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = jobs.client_id AND c.user_id = (select auth.uid())
    )
  );

CREATE POLICY "landscapers_view_assigned_jobs" ON public.jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = jobs.landscaper_id AND l.user_id = (select auth.uid())
    )
  );

CREATE POLICY "approved_landscapers_view_pending_jobs" ON public.jobs
  FOR SELECT USING (
    status = 'pending' AND EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.user_id = (select auth.uid()) AND l.is_approved = true
    )
  );

-- Quotes policies
CREATE POLICY "quotes_own_data" ON quotes
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "quotes_admin_access" ON quotes
  FOR ALL USING (is_admin((select auth.uid())));

CREATE POLICY "quotes_service_insert" ON quotes
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "landscapers_manage_own_quotes" ON public.quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = quotes.landscaper_id AND l.user_id = (select auth.uid())
    )
  );

CREATE POLICY "clients_view_quotes_for_jobs" ON public.quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.clients c ON c.id = j.client_id
      WHERE j.id = quotes.job_id AND c.user_id = (select auth.uid())
    )
  );

-- Job assignments policies
CREATE POLICY "landscapers_view_assignments" ON public.job_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = job_assignments.landscaper_id AND l.user_id = (select auth.uid())
    )
  );

CREATE POLICY "clients_view_job_assignments" ON public.job_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.clients c ON c.id = j.client_id
      WHERE j.id = job_assignments.job_id AND c.user_id = (select auth.uid())
    )
  );

-- Payments policies
CREATE POLICY "clients_view_payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = payments.client_id AND c.user_id = (select auth.uid())
    )
  );

CREATE POLICY "landscapers_view_payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = payments.landscaper_id AND l.user_id = (select auth.uid())
    )
  );

-- Reviews policies
CREATE POLICY "clients_manage_reviews" ON public.reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = reviews.client_id AND c.user_id = (select auth.uid())
    )
  );

CREATE POLICY "landscapers_view_reviews" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = reviews.landscaper_id AND l.user_id = (select auth.uid())
    )
  );

CREATE POLICY "public_view_verified_reviews" ON public.reviews
  FOR SELECT USING (is_verified = true);

-- Payouts policies
CREATE POLICY "landscapers_view_payouts" ON public.payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = payouts.landscaper_id AND l.user_id = (select auth.uid())
    )
  );

-- Job photos policies
CREATE POLICY "job_photos_access" ON job_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_photos.job_id 
      AND (jobs.client_id = (select auth.uid()) OR jobs.landscaper_id = (select auth.uid()))
    )
  );

CREATE POLICY "job_photos_admin_access" ON job_photos
  FOR ALL USING (is_admin((select auth.uid())));

CREATE POLICY "users_view_job_photos" ON public.job_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      LEFT JOIN public.clients c ON c.id = j.client_id
      LEFT JOIN public.landscapers l ON l.id = j.landscaper_id
      WHERE j.id = job_photos.job_id 
      AND (c.user_id = (select auth.uid()) OR l.user_id = (select auth.uid()))
    )
  );

CREATE POLICY "users_upload_job_photos" ON public.job_photos
  FOR INSERT WITH CHECK (uploaded_by = (select auth.uid()));

-- Communications policies
CREATE POLICY "communications_job_access" ON communications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = communications.job_id 
      AND (jobs.client_id = (select auth.uid()) OR jobs.landscaper_id = (select auth.uid()))
    )
  );

-- Notifications policies
CREATE POLICY "notifications_own_data" ON notifications
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "notifications_system_insert" ON notifications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Landscaper documents policies
CREATE POLICY "landscaper_documents_own_data" ON landscaper_documents
  FOR ALL USING ((select auth.uid()) = user_id);

-- Admin and security table policies
CREATE POLICY "admin_sessions_own_data" ON admin_sessions
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "login_attempts_own_data" ON login_attempts
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "password_reset_tokens_own_data" ON password_reset_tokens
  FOR ALL USING ((select auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_own_data" ON push_subscriptions
  FOR ALL USING ((select auth.uid()) = user_id);

-- Profiles policies
CREATE POLICY "profiles_view_own" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Quote requests policies
CREATE POLICY "quote_requests_admin_access" ON quote_requests
  FOR ALL USING (is_admin((select auth.uid())));

-- Admin policies (full access for admin users)
CREATE POLICY "admins_full_access_users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE landscapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE landscaper_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;