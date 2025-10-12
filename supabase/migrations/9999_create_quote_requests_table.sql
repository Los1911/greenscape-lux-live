-- Create quote_requests table for public quote form submissions
-- This table stores initial quote requests before they become full jobs

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  property_address TEXT NOT NULL,
  services TEXT[] NOT NULL,
  preferred_date DATE,
  comments TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'converted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON public.quote_requests(email);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON public.quote_requests(created_at);

-- Enable RLS
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT quote requests (public form)
CREATE POLICY "Allow anonymous insert quote_requests"
  ON public.quote_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to view all quote requests
CREATE POLICY "Allow authenticated select quote_requests"
  ON public.quote_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role all quote_requests"
  ON public.quote_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_quote_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_requests_timestamp
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_requests_updated_at();
