import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DocumentUpload from './DocumentUpload';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/SharedUI/Toast';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

export function DocumentUploadModal({ 
  isOpen, 
  onClose, 
  onUploadComplete 
}: DocumentUploadModalProps) {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Query documents directly by user_id - same approach as DocumentUpload component
      const { data, error } = await supabase
        .from('landscaper_documents')
        .select('id, user_id, file_url, file_name, document_type, uploaded_at')
        .eq('user_id', user.id);

      if (error) throw error;
      console.log('Fetched documents:', data);
      
      // Transform data to match expected interface - same as DocumentUpload component
      const transformedData = (data || []).map(doc => ({
        ...doc,
        file_type: doc.document_type // Map document_type to file_type
      }));
      
      console.log('Transformed documents:', transformedData);
      setDocuments(transformedData);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRequiredDocs = () => {
    const licenseDoc = documents.find(d => d.file_type === 'license');
    const insuranceDoc = documents.find(d => d.file_type === 'insurance');
    return licenseDoc && insuranceDoc;
  };

  const handleDocumentUpload = async (file: File, type: string) => {
    // This callback is called after successful upload
    console.log('Document uploaded, refreshing modal status...');
    await fetchDocuments();
  };

  const handleSubmit = async () => {
    if (!hasRequiredDocs()) {
      showToast('Please upload both Business License and Insurance Certificate', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Try to find landscaper profile by user_id
      const { data: landscaperData, error: landscaperError } = await supabase
        .from('landscapers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (landscaperError && landscaperError.code !== 'PGRST116') {
        console.error('Error fetching landscaper:', landscaperError);
        // Continue anyway - we can still mark documents as submitted
      }

      // Update landscaper profile if found
      if (landscaperData?.id) {
        const { error: updateError } = await supabase
          .from('landscapers')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('id', landscaperData.id);

        if (updateError) {
          console.warn('Could not update landscaper profile:', updateError);
        }
      }

      // Mark documents as submitted by updating their metadata
      const requiredDocs = documents.filter(d => ['license', 'insurance'].includes(d.file_type));
      
      if (requiredDocs.length > 0) {
        for (const doc of requiredDocs) {
          const { error: docUpdateError } = await supabase
            .from('landscaper_documents')
            .update({ 
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id);
            
          if (docUpdateError) {
            console.warn('Could not update document timestamp:', docUpdateError);
          }
        }
      }

      showToast('Documents submitted successfully! They will be reviewed shortly.', 'success');
      onUploadComplete?.();
      onClose();
    } catch (error: any) {
      console.error('Document submission error:', error);
      showToast(error.message || 'Error submitting documents', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-black/95 border-emerald-500/30">
        <DialogHeader>
          <DialogTitle className="text-emerald-300 text-xl">
            Upload Required Documents
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <DocumentUpload onUpload={handleDocumentUpload} />
        </div>
        
        {/* Status and Submit Section */}
        <div className="mt-6 p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-emerald-300 font-medium">Document Status</h4>
            <div className="text-sm">
              {hasRequiredDocs() ? (
                <span className="text-emerald-400">✓ Ready to Submit</span>
              ) : (
                <span className="text-yellow-400">⚠ Missing Required Documents</span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <span className={documents.find(d => d.file_type === 'license') ? 'text-emerald-400' : 'text-gray-400'}>
                {documents.find(d => d.file_type === 'license') ? '✓' : '○'}
              </span>
              <span className="text-emerald-100">Business License</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={documents.find(d => d.file_type === 'insurance') ? 'text-emerald-400' : 'text-gray-400'}>
                {documents.find(d => d.file_type === 'insurance') ? '✓' : '○'}
              </span>
              <span className="text-emerald-100">Insurance Certificate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={documents.find(d => d.file_type === 'certification') ? 'text-emerald-400' : 'text-gray-400'}>
                {documents.find(d => d.file_type === 'certification') ? '✓' : '○'}
              </span>
              <span className="text-emerald-100">Certifications</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={documents.find(d => d.file_type === 'portfolio') ? 'text-emerald-400' : 'text-gray-400'}>
                {documents.find(d => d.file_type === 'portfolio') ? '✓' : '○'}
              </span>
              <span className="text-emerald-100">Portfolio/References</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t border-emerald-500/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hasRequiredDocs() || submitting}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Documents'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}