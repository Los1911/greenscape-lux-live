import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { StarRating } from './StarRating';
import { Camera, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReviewFormProps {
  jobId: string;
  landscaperId: string;
  customerId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  jobId,
  landscaperId,
  customerId,
  onSubmit,
  onCancel
}) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files].slice(0, 5)); // Max 5 photos
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      // Upload photos if any
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const fileName = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { data, error } = await supabase.storage
          .from('job-photos')
          .upload(`reviews/${fileName}`, photo);
        
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('job-photos')
            .getPublicUrl(data.path);
          photoUrls.push(publicUrl);
        }
      }

      // Submit review
      const { error } = await supabase
        .from('reviews')
        .insert({
          customer_id: customerId,
          landscaper_id: landscaperId,
          job_id: jobId,
          rating,
          title: title.trim() || null,
          comment: comment.trim() || null,
          photos: photoUrls.length > 0 ? photoUrls : null
        });

      if (error) throw error;
      onSubmit();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Rate your experience *
        </label>
        <StarRating
          rating={rating}
          interactive
          onRatingChange={setRating}
          size="lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Review title (optional)
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Great work on my lawn!"
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Tell us about your experience
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share details about the quality of work, professionalism, timeliness..."
          rows={4}
          maxLength={1000}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Add photos (optional)
        </label>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Upload ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          {photos.length < 5 && (
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <Camera className="w-4 h-4" />
              <span className="text-sm">Add photos</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};