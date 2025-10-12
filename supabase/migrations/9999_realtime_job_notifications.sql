-- Real-time notification triggers for job events

-- Trigger: Notify client when landscaper accepts job
CREATE OR REPLACE FUNCTION notify_client_job_accepted()
RETURNS TRIGGER AS $$
DECLARE
  client_user_id UUID;
  landscaper_name TEXT;
  job_title TEXT;
BEGIN
  -- Only trigger when status changes to 'accepted' or 'assigned'
  IF (NEW.status IN ('accepted', 'assigned') AND OLD.status != NEW.status) THEN
    -- Get client user_id from profiles
    SELECT id INTO client_user_id FROM profiles WHERE id = NEW.customer_id;
    
    -- Get landscaper name
    SELECT full_name INTO landscaper_name FROM profiles WHERE id = NEW.landscaper_id;
    
    -- Get job title
    job_title := COALESCE(NEW.service_name, 'Your job');
    
    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, data, read)
    VALUES (
      client_user_id,
      'job_accepted',
      '✅ Job Accepted!',
      landscaper_name || ' has accepted your job: ' || job_title,
      jsonb_build_object('job_id', NEW.id, 'job_title', job_title, 'landscaper_name', landscaper_name),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER job_accepted_notification
  AFTER UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_job_accepted();
