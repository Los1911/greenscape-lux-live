-- Add payment workflow tracking tables
-- Creates tables for receipts, notifications, and payment status tracking

-- Receipts table for generated receipts
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  payment_intent_id TEXT NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0.00,
  landscaper_amount DECIMAL(10,2) DEFAULT 0.00,
  customer_name TEXT,
  customer_email TEXT,
  job_description TEXT,
  service_date DATE,
  receipt_url TEXT,
  receipt_number TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment notifications tracking
CREATE TABLE IF NOT EXISTS public.payment_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT CHECK (notification_type IN ('payment_success', 'payment_failed', 'receipt_generated', 'payout_scheduled')),
  recipient_email TEXT NOT NULL,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment workflow status tracking
CREATE TABLE IF NOT EXISTS public.payment_workflow_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  workflow_step TEXT NOT NULL CHECK (workflow_step IN ('payment_created', 'payment_confirmed', 'receipt_generated', 'notifications_sent', 'job_updated', 'payout_scheduled')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'skipped')),
  error_message TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update payments table to add workflow tracking columns
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS landscaper_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notifications_sent_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_customer_id ON public.receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_payment_id ON public.payment_notifications(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_status ON public.payment_notifications(status);
CREATE INDEX IF NOT EXISTS idx_payment_workflow_status_payment_id ON public.payment_workflow_status(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_workflow_status_step ON public.payment_workflow_status(workflow_step);

-- Generate receipt numbers automatically
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('receipt_sequence')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for receipt numbers
CREATE SEQUENCE IF NOT EXISTS receipt_sequence START 1;

-- Create trigger for receipt number generation
DROP TRIGGER IF EXISTS trigger_generate_receipt_number ON public.receipts;
CREATE TRIGGER trigger_generate_receipt_number
  BEFORE INSERT ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION generate_receipt_number();