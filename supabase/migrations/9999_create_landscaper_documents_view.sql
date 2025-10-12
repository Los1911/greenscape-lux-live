-- Create view for landscaper documents that maps document_type to file_type
-- and includes landscaper_id mapping

CREATE OR REPLACE VIEW v_landscaper_documents AS
SELECT 
  ld.id,
  ld.landscaper_id,
  ld.user_id,
  ld.file_url,
  ld.file_name,
  ld.file_size,
  COALESCE(ld.mime_type, ld.document_type) as file_type,
  ld.document_type,
  ld.mime_type,
  ld.uploaded_at,
  ld.created_at,
  ld.updated_at
FROM landscaper_documents ld
WHERE ld.landscaper_id IS NOT NULL;

-- Grant access to authenticated users
GRANT SELECT ON v_landscaper_documents TO authenticated;

-- Add RLS policy for the view
ALTER VIEW v_landscaper_documents SET (security_invoker = true);