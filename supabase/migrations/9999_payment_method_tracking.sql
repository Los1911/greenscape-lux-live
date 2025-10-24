-- Create tables for tracking payment method events and failures
CREATE TABLE IF NOT EXISTS payment_method_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_payment_method_id TEXT NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('attached', 'detached', 'updated', 'set_default')),
    card_brand TEXT,
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_failures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_charge_id TEXT,
    stripe_invoice_id TEXT,
    stripe_customer_id TEXT NOT NULL,
    stripe_payment_method_id TEXT,
    failure_code TEXT,
    failure_message TEXT,
    amount INTEGER,
    currency TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_subscription_id TEXT NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_method_events_customer ON payment_method_events(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_method_events_payment_method ON payment_method_events(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_failures_customer ON payment_failures(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_failures_payment_method ON payment_failures(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_customer ON subscription_events(stripe_customer_id);

-- Enable RLS
ALTER TABLE payment_method_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin access only for now)
CREATE POLICY "Admin can view payment method events" ON payment_method_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view payment failures" ON payment_failures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view subscription events" ON subscription_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow system (service role) to insert
CREATE POLICY "System can insert payment method events" ON payment_method_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert payment failures" ON payment_failures
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert subscription events" ON subscription_events
    FOR INSERT WITH CHECK (true);