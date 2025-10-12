-- RLS Policy Cleanup Script
-- This script removes all existing RLS policies and replaces them with simplified, standard patterns

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Drop all policies for each table
DROP POLICY IF EXISTS "Backend access only" ON admin_audit_logs;
DROP POLICY IF EXISTS "Own session access only" ON admin_sessions;

-- Bookings policies
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Landscapers can view assigned bookings" ON bookings;

-- Client quotes policies (multiple conflicting ones)
DROP POLICY IF EXISTS "Allow admin access to client_quotes" ON client_quotes;
DROP POLICY IF EXISTS "Client can view their own quotes" ON client_quotes;
DROP POLICY IF EXISTS "Landscapers can assign quotes to self" ON client_quotes;
DROP POLICY IF EXISTS "Landscapers can view assigned client quotes" ON client_quotes;
DROP POLICY IF EXISTS "Landscapers can view quotes" ON client_quotes;
DROP POLICY IF EXISTS "Landscapers can view unassigned quotes" ON client_quotes;
DROP POLICY IF EXISTS "public.client_quotes" ON client_quotes;

-- Clients policies (many duplicates)
DROP POLICY IF EXISTS "Admins can read all clients" ON clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON clients;
DROP POLICY IF EXISTS "admin access" ON clients;
DROP POLICY IF EXISTS "client can insert own row" ON clients;
DROP POLICY IF EXISTS "client can read own row" ON clients;
DROP POLICY IF EXISTS "clients_insert_own" ON clients;
DROP POLICY IF EXISTS "clients_select_own" ON clients;
DROP POLICY IF EXISTS "clients_update_own" ON clients;

-- Communications
DROP POLICY IF EXISTS "comms insert own jobs" ON communications;
DROP POLICY IF EXISTS "comms read own jobs" ON communications;

-- Competitor quotes
DROP POLICY IF EXISTS "Allow admin access to competitor_quotes" ON competitor_quotes;

-- Customers
DROP POLICY IF EXISTS "Allow customer to view own record" ON customers;

-- Email logs
DROP POLICY IF EXISTS "Admins can view email logs" ON email_logs;

-- Job photos
DROP POLICY IF EXISTS "admin_all_job_photos" ON job_photos;
DROP POLICY IF EXISTS "landscaper_insert_job_photos" ON job_photos;
DROP POLICY IF EXISTS "read_job_photos_for_owners" ON job_photos;

-- Jobs (many conflicting policies)
DROP POLICY IF EXISTS "Admins can delete jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can read all jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can view all" ON jobs;
DROP POLICY IF EXISTS "Allow anon insert to jobs" ON jobs;
DROP POLICY IF EXISTS "Clients can create jobs" ON jobs;
DROP POLICY IF EXISTS "Clients can read their own jobs" ON jobs;
DROP POLICY IF EXISTS "Landscapers can delete their own jobs" ON jobs;
DROP POLICY IF EXISTS "Landscapers can insert assigned jobs" ON jobs;
DROP POLICY IF EXISTS "Landscapers can read assigned jobs" ON jobs;
DROP POLICY IF EXISTS "Public can read completed jobs" ON jobs;
DROP POLICY IF EXISTS "admin_all_jobs" ON jobs;
DROP POLICY IF EXISTS "client_read_jobs" ON jobs;
DROP POLICY IF EXISTS "landscaper_delete_jobs" ON jobs;
DROP POLICY IF EXISTS "landscaper_read_jobs" ON jobs;
DROP POLICY IF EXISTS "landscaper_update_jobs" ON jobs;

-- Landscaper applications
DROP POLICY IF EXISTS "Allow update if draft" ON landscaper_applications;

-- Landscaper documents
DROP POLICY IF EXISTS "Users can manage their own documents" ON landscaper_documents;

-- Landscapers (MANY duplicate policies)
DROP POLICY IF EXISTS "Admin can view all landscapers" ON landscapers;
DROP POLICY IF EXISTS "Admins can read all landscapers" ON landscapers;
DROP POLICY IF EXISTS "Admins can update all landscapers" ON landscapers;
DROP POLICY IF EXISTS "Landscaper can update own profile" ON landscapers;
DROP POLICY IF EXISTS "Landscaper can view own record" ON landscapers;
DROP POLICY IF EXISTS "Landscapers can read their own profile" ON landscapers;
DROP POLICY IF EXISTS "Landscapers can update their own profile" ON landscapers;
DROP POLICY IF EXISTS "landscaper can update own row" ON landscapers;
DROP POLICY IF EXISTS "landscapers_insert_self" ON landscapers;
DROP POLICY IF EXISTS "landscapers_read_own" ON landscapers;
DROP POLICY IF EXISTS "landscapers_select_own" ON landscapers;
DROP POLICY IF EXISTS "landscapers_self_insert" ON landscapers;
DROP POLICY IF EXISTS "landscapers_self_select" ON landscapers;
DROP POLICY IF EXISTS "landscapers_self_update" ON landscapers;
DROP POLICY IF EXISTS "landscapers_update_own" ON landscapers;
DROP POLICY IF EXISTS "read_own_landscaper" ON landscapers;
DROP POLICY IF EXISTS "read_own_landscaper_row" ON landscapers;
DROP POLICY IF EXISTS "update_own_landscaper" ON landscapers;
DROP POLICY IF EXISTS "update_own_landscaper_row" ON landscapers;

-- Login attempts
DROP POLICY IF EXISTS "deny_all_fallback" ON login_attempts;
DROP POLICY IF EXISTS "insert_login_attempts" ON login_attempts;
DROP POLICY IF EXISTS "login_attempts" ON login_attempts;

-- Login logs
DROP POLICY IF EXISTS "Admin can view all login logs" ON login_logs;

-- Master login logs
DROP POLICY IF EXISTS "Admin can view master login logs" ON master_login_logs;

-- Notifications
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Password reset tokens
DROP POLICY IF EXISTS "Authenticated users can delete their own reset tokens" ON password_reset_tokens;

-- Password resets
DROP POLICY IF EXISTS "deny_all_fallback" ON password_resets;
DROP POLICY IF EXISTS "password_resets_select" ON password_resets;

-- Push subscriptions
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;

-- PW links
DROP POLICY IF EXISTS "service can insert" ON pw_links;
DROP POLICY IF EXISTS "service can read" ON pw_links;
DROP POLICY IF EXISTS "service can update used" ON pw_links;

-- Quote email logs
DROP POLICY IF EXISTS "Admins can view quote email logs" ON quote_email_logs;
DROP POLICY IF EXISTS "System can insert quote email logs" ON quote_email_logs;

-- Quotes
DROP POLICY IF EXISTS "Admin Read Only" ON quotes;
DROP POLICY IF EXISTS "insert_by_service_role" ON quotes;
DROP POLICY IF EXISTS "quotes_delete_by_user" ON quotes;
DROP POLICY IF EXISTS "quotes_insert_by_user" ON quotes;
DROP POLICY IF EXISTS "quotes_select_by_user" ON quotes;
DROP POLICY IF EXISTS "quotes_update_by_user" ON quotes;

-- Users
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Zip service areas
DROP POLICY IF EXISTS "Allow admin access to zip_service_areas" ON zip_service_areas;