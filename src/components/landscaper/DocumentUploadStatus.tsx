import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

interface UploadedDocument {
  id: string;
  file_url: string;
  document_type: string;
  file_name: string;
  uploaded_at: string;
}

export default function DocumentUploadStatus() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('Not authenticated');
        return;
      }

      // Get landscaper ID
      const { data: landscaper, error: landscaperError } = await supabase
        .from('v_landscapers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (landscaperError || !landscaper) {
        setError('Landscaper profile not found');
        return;
      }

      // Fetch documents - try view first, then fallback to table
      let data, fetchError;
      try {
        const result = await supabase
          .from('v_landscaper_documents')
          .select('id, file_url, file_type as document_type, uploaded_at')
          .eq('landscaper_id', landscaper.id)
          .order('uploaded_at', { ascending: false });
        data = result.data;
        fetchError = result.error;
      } catch (viewError) {
        console.log('View not available, using direct table query');
        const result = await supabase
          .from('landscaper_documents')
          .select('id, file_url, document_type, file_name, uploaded_at')
          .eq('landscaper_id', landscaper.id)
          .order('uploaded_at', { ascending: false });
        data = result.data;
        fetchError = result.error;
      }

      if (fetchError) {
        setError(`Failed to fetch documents: ${fetchError.message}`);
        return;
      }

      setDocuments(data || []);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('landscaper_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      // Refresh the list
      await fetchDocuments();
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-900 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Document Status</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-900 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Document Status</h3>
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg">
          <p>{error}</p>
          <Button onClick={fetchDocuments} className="mt-2" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Document Status ({documents.length} uploaded)
        </h3>
        <Button onClick={fetchDocuments} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium capitalize">
                    {doc.document_type.replace('_', ' ')}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {doc.file_name || 'Unknown filename'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(doc.uploaded_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View
                  </a>
                  <Button
                    onClick={() => deleteDocument(doc.id)}
                    variant="destructive"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}