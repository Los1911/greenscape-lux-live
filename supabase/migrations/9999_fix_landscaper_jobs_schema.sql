-- Add auth_user_id to landscapers (for linking to auth.users)
alter table public.landscapers
  add column if not exists auth_user_id uuid;

-- Best-effort backfill from auth.users by email
update public.landscapers l
set auth_user_id = u.id
from auth.users u
where l.auth_user_id is null
  and lower(l.email) = lower(u.email);

-- Index for fast lookup
create index if not exists idx_landscapers_auth_user_id
  on public.landscapers(auth_user_id);

-- Ensure jobs has the columns the app queries
alter table public.jobs
  add column if not exists service_name text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists landscaper_id uuid;

-- (Optional) If appropriate in this schema, add FK to landscapers.id
-- alter table public.jobs
--   add constraint jobs_landscaper_id_fkey
--   foreign key (landscaper_id) references public.landscapers(id);