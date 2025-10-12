import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from './StarRating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  photos?: string[];
  is_verified: boolean;
  response?: string;
  response_date?: string;
  created_at: string;
  customer: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface ReviewCardProps {
  review: Review;
  canRespond?: boolean;
  landscaperId?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  canRespond = false,
  landscaperId
}) => {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitResponse = async () => {
    if (!response.trim() || !landscaperId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          response: response.trim(),
          response_date: new Date().toISOString()
        })
        .eq('id', review.id)
        .eq('landscaper_id', landscaperId);

      if (error) throw error;
      
      setShowResponseForm(false);
      setResponse('');
      // Refresh the page or update the review in parent component
      window.location.reload();
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={review.customer.avatar_url} />
          <AvatarFallback>
            {review.customer.first_name[0]}{review.customer.last_name[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold">
              {review.customer.first_name} {review.customer.last_name[0]}.
            </h4>
            {review.is_verified && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(review.created_at)}
            </span>
          </div>

          {review.title && (
            <h5 className="font-medium mb-2">{review.title}</h5>
          )}

          {review.comment && (
            <p className="text-gray-700 mb-4">{review.comment}</p>
          )}

          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 mb-4">
              {review.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                  onClick={() => window.open(photo, '_blank')}
                />
              ))}
            </div>
          )}

          {review.response && (
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  Response from landscaper
                </span>
                {review.response_date && (
                  <span className="text-xs text-gray-500">
                    {formatDate(review.response_date)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700">{review.response}</p>
            </div>
          )}

          {canRespond && !review.response && !showResponseForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResponseForm(true)}
              className="mt-3"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Respond to review
            </Button>
          )}

          {showResponseForm && (
            <div className="mt-4 space-y-3">
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Thank your customer and address any concerns..."
                rows={3}
                maxLength={500}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitResponse}
                  disabled={!response.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Response'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponse('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};