# GreenScape Lux Test Data Reset

## ⚠️ WARNING: BACK UP FIRST
Before running any of these scripts, create a backup in Supabase:
Dashboard → Database → Backups → Create Backup

## Reset Options

### A) Targeted cleanup of test rows (pattern matches)
Removes only rows with test-like email patterns:
```sql
begin;
delete from quote_requests where email ilike 'test%';
delete from jobs where client_email ilike 'test%' or landscaper_email ilike 'test%';
delete from clients where email ilike 'test%';
delete from customers where email ilike 'test%';
delete from landscapers where email ilike 'test%';
commit;
```

### B) Full reset of domain tables (keep auth.users)
Completely clears all business data but preserves auth users:
```sql
begin;
truncate table
  jobs,
  quote_requests,
  landscapers,
  clients,
  customers
restart identity cascade;
commit;
```

### C) Re-seed examples (adjust to your schema)
After reset, add sample data linked to existing auth users:
```sql
-- Look up auth ids to reuse
-- select id, email from auth.users where email in ('client@example.com','pro@example.com');

-- Insert clients/landscapers linked to existing auth users
-- insert into clients (id, name, email, created_at) values ('<client_auth_id>', 'Demo Client', 'client@example.com', now());
-- insert into landscapers (id, first_name, last_name, email, auth_user_id, verification_status, created_at)
-- values ('<pro_auth_id>', 'Brad', 'Green', 'pro@example.com', '<pro_auth_id>', 'verified', now());

-- Add a couple of jobs
-- insert into jobs (id, service_name, status, price, address, scheduled_at, landscaper_id, client_email)
-- values
--  (gen_random_uuid(), 'Lawn Mowing', 'scheduled', 85, '123 Uptown St, Charlotte, NC', now() + interval '2 days', '<pro_auth_id>', 'client@example.com'),
--  (gen_random_uuid(), 'Hedge Trimming', 'completed', 140, '456 Plaza Rd, Charlotte, NC', now() - interval '3 days', '<pro_auth_id>', 'client@example.com');
```

## How to Run
1. Copy the SQL from the option you want
2. Go to Supabase → SQL Editor
3. Paste and execute the SQL
4. Verify results in the Table Editor