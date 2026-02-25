import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function DocumentsCompliance() {
  const [documents, setDocuments] = useState({
    insurance_verified: false,
    profile_complete: false
  });

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // NOTE: insurance_file and license_file columns may not exist in landscapers table
          // Use insurance_verified which is a known column
          const { data, error } = await supabase
            .from('landscapers')
            .select('insurance_verified, profile_complete')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('[DocumentsCompliance] Error fetching documents:', error);
            return;
          }
          
          if (data) {
            setDocuments({
              insurance_verified: data.insurance_verified || false,
              profile_complete: data.profile_complete || false
            });
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
          <div className="text-sm text-green-200 mb-2">Insurance Verification</div>
          <div className="flex items-center gap-3">
            <button className={`rounded-full px-3 py-1 text-xs ${
              documents.insurance_verified 
                ? 'bg-green-500/15 text-green-300' 
                : 'bg-yellow-500/15 text-yellow-300'
            }`}>
              {documents.insurance_verified ? 'Verified' : 'Pending'}
            </button>
          </div>
        </div>
        
        <div>
          <div className="text-sm text-green-200 mb-2">Profile Status</div>
          <div className="flex items-center gap-3">
            <button className={`rounded-full px-3 py-1 text-xs ${
              documents.profile_complete 
                ? 'bg-green-500/15 text-green-300' 
                : 'bg-yellow-500/15 text-yellow-300'
            }`}>
              {documents.profile_complete ? 'Complete' : 'Incomplete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
