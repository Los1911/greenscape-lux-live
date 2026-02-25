-- Route Optimization System Migration
-- Adds columns for advanced route optimization and scheduling

-- Add sequence_order to jobs table for route ordering
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS sequence_order INTEGER DEFAULT 0;

-- Add index for efficient sequence ordering queries
CREATE INDEX IF NOT EXISTS idx_jobs_sequence_order 
ON jobs(landscaper_id, scheduled_date, sequence_order);

-- Add route_optimized flag to track which routes have been optimized
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS route_optimized BOOLEAN DEFAULT false;

-- Add route_optimization_timestamp to track when route was last optimized
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS route_optimization_timestamp TIMESTAMPTZ;

-- Create function to auto-increment sequence_order for new jobs
CREATE OR REPLACE FUNCTION set_default_sequence_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sequence_order IS NULL OR NEW.sequence_order = 0 THEN
    SELECT COALESCE(MAX(sequence_order), 0) + 1
    INTO NEW.sequence_order
    FROM jobs
    WHERE landscaper_id = NEW.landscaper_id
    AND DATE(scheduled_date) = DATE(NEW.scheduled_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-incrementing sequence_order
DROP TRIGGER IF EXISTS trigger_set_sequence_order ON jobs;
CREATE TRIGGER trigger_set_sequence_order
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_default_sequence_order();

-- Add comment explaining the system
COMMENT ON COLUMN jobs.sequence_order IS 'Order of job in daily route (1-indexed)';
COMMENT ON COLUMN jobs.route_optimized IS 'Whether this job is part of an optimized route';
COMMENT ON COLUMN jobs.route_optimization_timestamp IS 'When the route was last optimized';
