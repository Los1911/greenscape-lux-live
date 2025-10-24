# Database Migration Guide

## Overview
This guide provides comprehensive database migration scripts for the landscaping application, including all required tables, relationships, indexes, and security policies.

## Migration Files

### 001_core_tables.sql
- **Users table**: Extended user profiles with roles (client, landscaper, admin)
- **Clients table**: Client-specific profile information and Stripe integration
- **Landscapers table**: Landscaper profiles with business details and approval status
- **Indexes**: Performance optimization for common queries

### 002_jobs_and_quotes.sql
- **Jobs table**: Job requests with detailed specifications and status tracking
- **Quotes table**: Landscaper quotes with pricing breakdown
- **Job assignments table**: Tracks landscaper assignments to jobs
- **Indexes**: Optimized for job searches and status filtering

### 003_payments_and_reviews.sql
- **Payments table**: Stripe payment tracking with platform fees
- **Reviews table**: Customer reviews and ratings system
- **Payouts table**: Landscaper earnings and payout tracking
- **Job photos table**: Photo management for jobs
- **Indexes**: Financial reporting and review queries

### 004_rls_policies.sql
- **Row Level Security**: Comprehensive data protection
- **User access control**: Role-based permissions
- **Data isolation**: Ensures users only see their own data

### 005_additional_policies.sql
- **Additional RLS policies**: Completes security implementation
- **Admin access**: Full system access for administrators
- **Automatic timestamps**: Triggers for updated_at fields

## Key Features

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access control (client, landscaper, admin)
- Data isolation between users
- Secure payment processing integration

### Performance
- Strategic indexes on frequently queried columns
- Optimized for common application workflows
- Efficient joins between related tables

### Data Integrity
- Foreign key constraints
- Check constraints for data validation
- Unique constraints where appropriate
- Automatic timestamp management

## Running Migrations

1. **Connect to Supabase**:
   ```bash
   supabase db reset
   ```

2. **Run migrations in order**:
   ```bash
   supabase db push
   ```

3. **Verify tables**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

## Table Relationships

```
users (1) → (1) clients
users (1) → (1) landscapers
clients (1) → (many) jobs
landscapers (1) → (many) jobs
jobs (1) → (many) quotes
jobs (1) → (many) payments
jobs (1) → (many) reviews
jobs (1) → (many) job_photos
landscapers (1) → (many) payouts
```

## Important Notes

1. **Stripe Integration**: Tables include Stripe customer and connect account IDs
2. **Photo Storage**: Uses Supabase Storage with URL references
3. **Status Tracking**: Comprehensive status fields for workflow management
4. **Financial Tracking**: Platform fees and payout calculations built-in
5. **Review System**: Verified reviews with helpful voting

## Next Steps

After running migrations:
1. Configure Stripe webhooks
2. Set up storage buckets for photos
3. Test RLS policies with different user roles
4. Populate initial admin user data
5. Configure email templates for notifications

## Troubleshooting

- **Permission errors**: Ensure RLS policies are correctly applied
- **Foreign key violations**: Check data insertion order
- **Index performance**: Monitor query performance and add indexes as needed
- **Storage issues**: Configure Supabase Storage buckets for photo uploads