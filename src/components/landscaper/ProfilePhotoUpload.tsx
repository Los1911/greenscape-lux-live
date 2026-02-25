import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { compressImage } from '@/utils/imageCompression';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (file: File | null, previewUrl: string) => void;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ProfilePhotoUpload({ currentPhotoUrl, onPhotoChange, error }: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string>(currentPhotoUrl || '');
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setValidationError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setValidationError('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Compress image
      const compressed = await compressImage(file, 800, 0.85);
      
      // Create preview
      const previewUrl = URL.createObjectURL(compressed);
      setPreview(previewUrl);
      
      // Notify parent
      onPhotoChange(compressed, previewUrl);
    } catch (err) {
      setValidationError('Failed to process image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    setValidationError('');
    onPhotoChange(null, '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-emerald-300">Business Logo / Profile Photo</Label>
      
      <div className="flex flex-col items-center gap-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Profile preview"
              className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
            />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-black/40 border-2 border-dashed border-emerald-500/30 flex items-center justify-center">
            <Camera className="w-12 h-12 text-emerald-500/40" />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/30"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {preview ? 'Change Photo' : 'Upload Photo'}
            </>
          )}
        </Button>

        <p className="text-xs text-emerald-300/60 text-center">
          Max size: 5MB • JPG, PNG, or GIF
        </p>
      </div>

      {(validationError || error) && (
        <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-lg p-2">
          {validationError || error}
        </div>
      )}
    </div>
  );
}
