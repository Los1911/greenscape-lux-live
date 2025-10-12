-- Row Level Security (RLS) Policies
-- Implements comprehensive data protection and access control

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landscapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Clients policies
CREATE POLICY "Clients can view their own profile" ON public.clients
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Landscapers can view client profiles for their jobs" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.landscapers l ON l.id = j.landscaper_id
      WHERE j.client_id = clients.id AND l.user_id = auth.uid()
    )
  );

-- Landscapers policies
CREATE POLICY "Landscapers can view their own profile" ON public.landscapers
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Clients can view approved landscaper profiles" ON public.landscapers
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Admins can view all landscaper profiles" ON public.landscapers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Jobs policies
CREATE POLICY "Clients can manage their own jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = jobs.client_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Landscapers can view jobs assigned to them" ON public.jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = jobs.landscaper_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Approved landscapers can view pending jobs" ON public.jobs
  FOR SELECT USING (
    status = 'pending' AND EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.user_id = auth.uid() AND l.is_approved = true
    )
  );

-- Quotes policies
CREATE POLICY "Landscapers can manage their own quotes" ON public.quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.landscapers l 
      WHERE l.id = quotes.landscaper_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view quotes for their jobs" ON public.quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.clients c ON c.id = j.client_id
      WHERE j.id = quotes.job_id AND c.user_id = auth.uid()
    )
  );