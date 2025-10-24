-- Create v_landscapers view that components are expecting
-- This view provides a simple interface to landscaper data
CREATE OR REPLACE VIEW public.v_landscapers AS
SELECT 
  l.id,
  l.user_id,
  l.email,
  l.first_name,
  l.last_name,
  l.phone,
  l.business_name,
  l.license_number,
  l.insurance_verified,
  l.created_at,
  l.updated_at,
  -- Add insurance_expiry as null since it doesn't exist in base table
  null as insurance_expiry,
  -- Map insurance_verified to insurance_status for compatibility
  CASE 
    WHEN l.insurance_verified = true THEN 'verified'
    WHEN l.insurance_verified = false THEN 'pending'
    ELSE 'not_submitted'
  END as insurance_status
FROM public.landscapers l;

-- Enable RLS on the view
ALTER VIEW public.v_landscapers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow landscapers to see their own data
CREATE POLICY "Landscapers can view own data" ON public.v_landscapers
  FOR SELECT USING (
    auth.uid() = user_id::uuid
  );