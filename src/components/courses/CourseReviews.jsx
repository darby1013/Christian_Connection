import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, ThumbsUp, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function CourseReviews({ courseId, user }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['courseReviews', courseId],
    queryFn: () => base44.entities.CourseReview.filter({ course_id: courseId, is_approved: true }, '-created_date'),
    enabled: !!courseId,
    initialData: [],
  });

  const { data: userProgress } = useQuery({
    queryKey: ['userProgress', user?.id, courseId],
    queryFn: () => base44.entities.CourseProgress.filter({ user_id: user.id, course_id: courseId }).then(res => res[0]),
    enabled: !!user && !!courseId,
  });

  const { data: userReview } = useQuery({
    queryKey: ['userReview', user?.id, courseId],
    queryFn: () => base44.entities.CourseReview.filter({ user_id: user.id, course_id: courseId }).then(res => res[0]),
    enabled: !!user && !!courseId,
  });

  const createReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseReview.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseReviews'] });
      queryClient.invalidateQueries({ queryKey: ['userReview'] });
      setRating(0);
      setReviewText("");
    },
  });

  const handleSubmitReview = () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    createReviewMutation.mutate({
      course_id: courseId,
      user_id: user.id,
      user_name: user.full_name,
      user_image: user.profile_image,
      rating,
      review_text: reviewText,
      is_verified_completion: userProgress?.is_completed || false
    });
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-6xl font-black text-white mb-2">{avgRating.toFixed(1)}</p>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${star <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                  />
                ))}
              </div>
              <p className="text-slate-400">{reviews.length} reviews</p>
            </div>

            <div className="space-y-2">
              {ratingDistribution.map(({ stars, count, percentage }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm w-12">{stars} star</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-slate-400 text-sm w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review */}
      {user && !userReview && userProgress && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-white font-bold text-lg mb-4">Write a Review</h3>
            
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">Your Rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-10 h-10 transition-all ${
                        star <= (hoveredStar || rating)
                          ? 'text-amber-400 fill-amber-400 scale-110'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Share your experience with this course..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white h-32 mb-4"
            />

            <Button
              onClick={handleSubmitReview}
              disabled={rating === 0}
              className="bg-gradient-to-r from-purple-600 to-cyan-500"
            >
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12 border-2 border-cyan-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold">
                    {review.user_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold">{review.user_name}</h4>
                        {review.is_verified_completion && (
                          <Badge className="bg-green-500 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs">
                        {format(new Date(review.created_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.review_text && (
                    <p className="text-slate-300 text-sm mb-3">{review.review_text}</p>
                  )}
                  {review.is_featured && (
                    <Badge className="bg-purple-500 text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Featured Review
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <Star className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No reviews yet. Be the first to review this course!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}