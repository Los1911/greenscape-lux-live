-- Create webhook_logs table for storing Stripe webhook events
create table if not exists webhook_logs (
  id bigserial primary key,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

-- Create index on event_id for faster lookups
create index if not exists idx_webhook_logs_event_id on webhook_logs(event_id);

-- Create index on event_type for filtering by event type
create index if not exists idx_webhook_logs_event_type on webhook_logs(event_type);

-- Create index on created_at for chronological queries
create index if not exists idx_webhook_logs_created_at on webhook_logs(created_at);

-- Add unique constraint to prevent duplicate event processing
alter table webhook_logs add constraint unique_event_id unique (event_id);