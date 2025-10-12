-- Enhanced notification system for Stripe Connect, payments, and jobs
-- Adds automatic notification creation for approval_logs inserts

-- Add new notification types
COMMENT ON COLUMN notifications.type IS 'Notification types: stripe_connect_active, stripe_connect_restricted, stripe_connect_pending, stripe_charges_enabled, stripe_payouts_enabled, payout_success, payout_failed, payout_processing, job_assigned, job_completed, job_cancelled, payment_received, payment_failed';

-- Create function to automatically create notifications from approval_logs
CREATE OR REPLACE FUNCTION create_notification_from_approval_log()
RETURNS TRIGGER AS $$
DECLARE
    notification_type VARCHAR(50);
    notification_title VARCHAR(255);
    notification_message TEXT;
    landscaper_user_id UUID;
BEGIN
    -- Get the landscaper's user_id
    SELECT user_id INTO landscaper_user_id
    FROM landscapers
    WHERE id = NEW.landscaper_id;

    -- Determine notification type and content based on approval log
    IF NEW.stripe_charges_enabled = true AND NEW.stripe_payouts_enabled = true THEN
        notification_type := 'stripe_connect_active';
        notification_title := '🎉 Payment Account Fully Active!';
        notification_message := 'Your Stripe Connect account is now fully active. You can accept payments and receive payouts.';
    ELSIF NEW.stripe_charges_enabled = true AND NEW.stripe_payouts_enabled = false THEN
        notification_type := 'stripe_charges_enabled';
        notification_title := '✅ Charges Enabled';
        notification_message := 'You can now accept payments. Complete banking details to enable payouts.';
    ELSIF NEW.stripe_payouts_enabled = true AND NEW.stripe_charges_enabled = false THEN
        notification_type := 'stripe_payouts_enabled';
        notification_title := '✅ Payouts Enabled';
        notification_message := 'Your payout account is ready. Complete verification to accept charges.';
    ELSIF NEW.stripe_details_submitted = false THEN
        notification_type := 'stripe_connect_pending';
        notification_title := '⚠️ Complete Account Setup';
        notification_message := 'Please complete your Stripe Connect account setup to start accepting payments.';
    ELSE
        notification_type := 'stripe_connect_restricted';
        notification_title := '⏳ Account Under Review';
        notification_message := 'Your payment account is being reviewed. This typically takes 1-2 business days.';
    END IF;

    -- Insert notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        read
    ) VALUES (
        landscaper_user_id,
        notification_type,
        notification_title,
        notification_message,
        jsonb_build_object(
            'landscaper_id', NEW.landscaper_id,
            'stripe_connect_id', NEW.stripe_connect_id,
            'charges_enabled', NEW.stripe_charges_enabled,
            'payouts_enabled', NEW.stripe_payouts_enabled,
            'details_submitted', NEW.stripe_details_submitted,
            'approval_log_id', NEW.id
        ),
        false
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on approval_logs
DROP TRIGGER IF EXISTS on_approval_log_create_notification ON approval_logs;
CREATE TRIGGER on_approval_log_create_notification
    AFTER INSERT ON approval_logs
    FOR EACH ROW
    WHEN (NEW.stripe_connect_id IS NOT NULL)
    EXECUTE FUNCTION create_notification_from_approval_log();

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_unread 
ON notifications(user_id, type, read, created_at DESC);
