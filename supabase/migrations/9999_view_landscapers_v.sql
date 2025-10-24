-- Create compatibility view to normalize user_id vs auth_user_id mismatch
-- This view allows queries to work regardless of which column exists
create or replace view public.landscapers_v as
select
  l.*,
  coalesce(l.auth_user_id, u.id) as auth_user_id_resolved
from public.landscapers l
left join auth.users u
  on lower(u.email) = lower(l.email);