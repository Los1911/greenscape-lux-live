import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  bucket: string;
  field: 'insurance_url' | 'license_url';
  onUploaded?: (publicUrl: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export default function FileUpload({ 
  bucket, 
  field, 
  onUploaded, 
  accept = 'image/*,application/pdf',
  maxSize = 10,
  className = ''
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    
    const allowedTypes = accept.split(',').map(type => type.trim());
    const isValidType = allowedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });
    
    if (!isValidType) {
      return 'Invalid file type';
    }
    
    return null;
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setSuccess(null);
    setProgress(0);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setUploading(true);
    
    try {
      // Get authenticated user
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Not authenticated');

      // Upload to storage in user-specific folder
      const path = `${user.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        
      if (uploadError) throw uploadError;

      setProgress(50);

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = publicUrlData?.publicUrl;
      
      if (!publicUrl) throw new Error('Could not create public URL');

      setProgress(75);

      // Update landscaper record
      const { error: updateError } = await supabase
        .from('landscapers')
        .update({ [field]: publicUrl })
        .eq('user_id', user.id);
        
      if (updateError) throw updateError;

      setProgress(100);
      setSuccess('File uploaded successfully!');
      onUploaded?.(publicUrl);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => {
        setProgress(0);
        setSuccess(null);
      }, 3000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={handleFileSelect}
          className="hidden"
          id={`file-upload-${field}`}
        />
        
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-green-500 hover:bg-green-400 text-black font-medium"
        >
          {uploading ? 'Uploading...' : 'Choose File'}
        </Button>
        
        <span className="text-sm text-gray-400">
          Max {maxSize}MB • {accept.replace(/,/g, ', ')}
        </span>
      </div>
      
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-400">Uploading... {progress}%</p>
        </div>
      )}
      
      {error && (
        <Alert className="border-red-500 bg-red-900/20">
          <AlertDescription className="text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-500 bg-green-900/20">
          <AlertDescription className="text-green-400">
            {success}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}