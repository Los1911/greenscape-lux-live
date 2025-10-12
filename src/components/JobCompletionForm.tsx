import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ added
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface JobCompletionFormProps {
  jobId: number;
  status: string;
  beforeUrl?: string;
  afterUrl?: string;
}

const JobCompletionForm: React.FC<JobCompletionFormProps> = ({
  jobId,
  status,
  beforeUrl,
  afterUrl
}) => {
  const navigate = useNavigate(); // ✅ added
  const isCompleted = status === 'Completed';
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const uploadPhoto = async (file: File, pathPrefix: string) => {
    const filePath = `${jobId}/${pathPrefix}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('job-photos').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setUploading(true);

    try {
      if (!beforeFile || !afterFile) {
        throw new Error('Please select both before and after photos');
      }

      const beforeUpload = await uploadPhoto(beforeFile, 'before');
      const afterUpload = await uploadPhoto(afterFile, 'after');

      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          before_photo_url: beforeUpload,
          after_photo_url: afterUpload,
          status: 'Completed'
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      setIsSuccess(true);
      navigate('/job-complete'); // ✅ redirect on success
    } catch (err: any) {
      setMessage(err.message);
      setIsSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-green-500/30 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-white mb-6">Complete Job</h3>

      {isCompleted && (
        <div className="mb-4 space-y-4">
          <div>
            <p className="text-green-400 font-medium">Before Photo</p>
            {beforeUrl ? (
              <img src={beforeUrl} alt="Before" className="mt-2 rounded border border-green-600 w-full max-w-xs" />
            ) : (
              <p className="text-gray-400">No photo available</p>
            )}
          </div>
          <div>
            <p className="text-green-400 font-medium">After Photo</p>
            {afterUrl ? (
              <img src={afterUrl} alt="After" className="mt-2 rounded border border-green-600 w-full max-w-xs" />
            ) : (
              <p className="text-gray-400">No photo available</p>
            )}
          </div>
        </div>
      )}

      {!isCompleted && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-green-400 font-medium mb-2">
              Before Photo *
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setBeforeFile(e.target.files?.[0] || null)}
              className="bg-gray-800 border-gray-700 text-white file:bg-green-500 file:text-black file:border-0 file:rounded file:px-3 file:py-1"
              required
            />
          </div>

          <div>
            <label className="block text-green-400 font-medium mb-2">
              After Photo *
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setAfterFile(e.target.files?.[0] || null)}
              className="bg-gray-800 border-gray-700 text-white file:bg-green-500 file:text-black file:border-0 file:rounded file:px-3 file:py-1"
              required
            />
          </div>

          {message && (
            <div className={`p-3 rounded ${isSuccess ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
              <p className={isSuccess ? 'text-green-400' : 'text-red-400'}>
                {message}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={uploading || !beforeFile || !afterFile}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3"
          >
            {uploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                Uploading...
              </div>
            ) : (
              'Submit Photos'
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default JobCompletionForm;