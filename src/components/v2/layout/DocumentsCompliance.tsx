import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function DocumentsCompliance() {
  const [documents, setDocuments] = useState({
    insurance_file: null,
    license_file: null
  });

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('landscapers')
            .select('insurance_file, license_file')
            .eq('id', user.id)
            .single();
          if (data) {
            setDocuments(data);
          }
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };
    fetchDocuments();
  }, []);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-green-300">Documents and Compliance</h2>
        </div>
        <span className="text-xs text-green-300/70">Max 5 MB</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-sm text-green-200 mb-2">Insurance Document</div>
          <div className="flex items-center gap-3">
            <button className={`rounded-full px-3 py-1 text-xs ${
              documents.insurance_file 
                ? 'bg-green-500/15 text-green-300' 
                : 'bg-red-500/15 text-red-300'
            }`}>
              {documents.insurance_file ? 'Uploaded' : 'Missing'}
            </button>
            {documents.insurance_file && (
              <button className="text-xs text-green-300 underline hover:text-green-200">View File</button>
            )}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-green-200 mb-2">License and Certification</div>
          <div className="flex items-center gap-3">
            <button className={`rounded-full px-3 py-1 text-xs ${
              documents.license_file 
                ? 'bg-green-500/15 text-green-300' 
                : 'bg-red-500/15 text-red-300'
            }`}>
              {documents.license_file ? 'Uploaded' : 'Missing'}
            </button>
            {documents.license_file && (
              <button className="text-xs text-green-300 underline hover:text-green-200">View File</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}