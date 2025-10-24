import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StarRating } from './StarRating';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { Star, MessageSquare, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReviewsSectionProps {
  landscaperId: string;
  canWriteReview?: boolean;
  jobId?: string;
  customerId?: string;
  showAddReview?: boolean;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { [key: number]: number };
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  landscaperId,
  canWriteReview = false,
  jobId,
  customerId,
  showAddReview = false
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: {}
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [landscaperId]);

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          *,
          customer:customers(first_name, last_name, avatar_url)
        `)
        .eq('landscaper_id', landscaperId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(reviewsData || []);
      calculateStats(reviewsData || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewsData: any[]) => {
    if (reviewsData.length === 0) {
      setStats({ averageRating: 0, totalReviews: 0, ratingBreakdown: {} });
      return;
    }

    const totalReviews = reviewsData.length;
    const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    const ratingBreakdown = reviewsData.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    setStats({ averageRating, totalReviews, ratingBreakdown });
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    fetchReviews();
  };

  if (loading) {
    return <div className="animate-pulse">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
              <span className="text-3xl font-bold">
                {stats.averageRating.toFixed(1)}
              </span>
            </div>
            <StarRating rating={Math.round(stats.averageRating)} />
            <p className="text-sm text-gray-600 mt-1">
              Based on {stats.totalReviews} reviews
            </p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-3">{rating}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${((stats.ratingBreakdown[rating] || 0) / stats.totalReviews) * 100}%`
                    }}
                  />
                </div>
                <span className="w-8 text-right">
                  {stats.ratingBreakdown[rating] || 0}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center">
            <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-center text-gray-600">
              {stats.averageRating >= 4.5 ? 'Excellent' :
               stats.averageRating >= 4.0 ? 'Very Good' :
               stats.averageRating >= 3.5 ? 'Good' :
               stats.averageRating >= 3.0 ? 'Average' : 'Below Average'} rating
            </p>
          </div>
        </div>

        {canWriteReview && showAddReview && (
          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={() => setShowReviewForm(true)}
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Write a Review
            </Button>
          </div>
        )}
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          Customer Reviews ({stats.totalReviews})
        </h3>
        
        {reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reviews yet</p>
          </Card>
        ) : (
          reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>

      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          {jobId && customerId && (
            <ReviewForm
              jobId={jobId}
              landscaperId={landscaperId}
              customerId={customerId}
              onSubmit={handleReviewSubmitted}
              onCancel={() => setShowReviewForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};