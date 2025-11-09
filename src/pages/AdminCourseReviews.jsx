import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Star, Search, CheckCircle, XCircle, Eye, Trash2, TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AdminCourseReviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.CourseReview.list('-created_date'),
    initialData: [],
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
    initialData: [],
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseReview.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReviews'] });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseReview.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReviews'] });
    },
  });

  const handleApprove = (reviewId) => {
    updateReviewMutation.mutate({ id: reviewId, data: { is_approved: true } });
  };

  const handleReject = (reviewId) => {
    updateReviewMutation.mutate({ id: reviewId, data: { is_approved: false } });
  };

  const handleFeature = (reviewId, currentStatus) => {
    updateReviewMutation.mutate({ id: reviewId, data: { is_featured: !currentStatus } });
  };

  const handleDelete = (reviewId) => {
    if (confirm('Delete this review permanently?')) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Unknown Course';
  };

  const filteredReviews = reviews.filter(r =>
    r.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.review_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingReviews = filteredReviews.filter(r => !r.is_approved);
  const approvedReviews = filteredReviews.filter(r => r.is_approved);
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Course Reviews</h2>
          <p className="text-slate-400 font-semibold">Moderate and manage course reviews</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{reviews.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Reviews</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{avgRating.toFixed(1)}</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Rating</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{approvedReviews.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{approvedReviews.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Approved</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">{pendingReviews.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{pendingReviews.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search reviews..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">
            All ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-cyan-500">
            Pending ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-cyan-500">
            Approved ({approvedReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-4">
          {filteredReviews.map((review) => (
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
                          {review.is_featured && (
                            <Badge className="bg-purple-500 text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs">{getCourseName(review.course_id)}</p>
                        <p className="text-slate-500 text-xs">
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
                    <div className="flex items-center gap-2">
                      {!review.is_approved ? (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(review.id)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleReject(review.id)}
                          variant="outline"
                          className="border-red-500/30 text-red-400"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Unapprove
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleFeature(review.id, review.is_featured)}
                        className={review.is_featured ? 'bg-purple-500' : 'bg-slate-700'}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {review.is_featured ? 'Unfeature' : 'Feature'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(review.id)}
                        className="border-red-500/30 text-red-400"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingReviews.map((review) => (
            <Card key={review.id} className="bg-[#1a1f3a] border-amber-500/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold">
                      {review.user_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-white font-bold mb-1">{review.user_name}</h4>
                    <p className="text-slate-400 text-xs mb-2">{getCourseName(review.course_id)}</p>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{review.review_text}</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(review.id)} className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(review.id)} variant="outline" className="border-red-500/30 text-red-400">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingReviews.length === 0 && (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-12 text-center">
                <Eye className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No pending reviews</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6 space-y-4">
          {approvedReviews.map((review) => (
            <Card key={review.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold">
                      {review.user_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-white font-bold">{review.user_name}</h4>
                        <p className="text-slate-400 text-xs">{getCourseName(review.course_id)}</p>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{review.review_text}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleFeature(review.id, review.is_featured)}
                        className={review.is_featured ? 'bg-purple-500' : 'bg-slate-700'}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {review.is_featured ? 'Unfeature' : 'Feature'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}