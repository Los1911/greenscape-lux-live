import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Star, User, Calendar, ThumbsUp } from 'lucide-react';

interface Review {
  id: string;
  customer_id: string;
  landscaper_id: string;
  job_id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer_name?: string;
  job_title?: string;
}

interface ReviewSystemProps {
  landscaperId?: string;
  customerId?: string;
  jobId?: string;
  mode: 'display' | 'create';
}

const StarRating = ({ rating, onRatingChange, readonly = false }: any) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 cursor-pointer transition-colors ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
          onClick={() => !readonly && onRatingChange?.(star)}
        />
      ))}
    </div>
  );
};

export default function ReviewSystem({ landscaperId, customerId, jobId, mode }: ReviewSystemProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'display') {
      fetchReviews();
    }
  }, [landscaperId, mode]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          customers(full_name),
          jobs(title)
        `)
        .order('created_at', { ascending: false });

      if (landscaperId) {
        query = query.eq('landscaper_id', landscaperId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedReviews = data?.map(review => ({
        ...review,
        customer_name: review.customers?.full_name || 'Anonymous',
        job_title: review.jobs?.title || 'Landscaping Service'
      })) || [];

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!newReview.rating || !customerId || !landscaperId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          customer_id: customerId,
          landscaper_id: landscaperId,
          job_id: jobId,
          rating: newReview.rating,
          comment: newReview.comment
        });

      if (error) throw error;

      setNewReview({ rating: 0, comment: '' });
      
      // Refresh reviews if in display mode
      if (mode === 'display') {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (mode === 'create') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Leave a Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <StarRating 
              rating={newReview.rating} 
              onRatingChange={(rating: number) => setNewReview({...newReview, rating})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Comment</label>
            <Textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
              placeholder="Share your experience with this landscaper..."
              rows={4}
            />
          </div>

          <Button 
            onClick={submitReview}
            disabled={!newReview.rating || submitting}
            className="w-full"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Reviews ({reviews.length})
          </div>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(averageRating)} readonly />
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} average
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No reviews yet
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{review.customer_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {review.job_title}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <StarRating rating={review.rating} readonly />
                
                {review.comment && (
                  <p className="mt-2 text-gray-700">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}